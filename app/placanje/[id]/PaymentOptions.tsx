'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) 
  : Promise.resolve(null);

function CheckoutForm({ clientSecret, orderId, amount }: { clientSecret: string, orderId: string, amount: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard/narudzbe/${orderId}?payment=success`,
      },
    });

    if (error) {
      setError(error.message || 'Došlo je do pogreške prilikom plaćanja.');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement options={{ layout: 'accordion' }} />
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <button
        disabled={!stripe || loading}
        className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm text-lg disabled:opacity-70"
      >
        {loading ? 'Procesiranje...' : `Plati ${(amount / 100).toFixed(2)} €`}
      </button>
    </form>
  );
}

export default function PaymentOptions({ order: initialOrder, appSettings }: { order: any, appSettings: any }) {
  const [order, setOrder] = useState(initialOrder);
  const [paymentModel, setPaymentModel] = useState<'100%' | '50-50'>(initialOrder.payment_model);
  const [method, setMethod] = useState<'card' | 'iban'>('card');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amounts, setAmounts] = useState<{ base: number, total: number } | null>(null);
  const [loadingSecret, setLoadingSecret] = useState(false);
  const [ibanProof, setIbanProof] = useState<File | null>(null);
  const [ibanLoading, setIbanLoading] = useState(false);
  const [ibanError, setIbanError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const amountToPay = paymentModel === '50-50' ? order.deposit_cents : order.total_cents;

  const updateOrderModel = async (model: '100%' | '50-50') => {
    setPaymentModel(model);
    setClientSecret(null);
    setAmounts(null);
    
    const depositCents = model === '50-50' ? Math.floor(order.total_cents / 2) : order.total_cents;
    const finalCents = order.total_cents - depositCents;

    const { data, error } = await supabase
      .from('orders')
      .update({ 
        payment_model: model,
        deposit_cents: depositCents,
        final_cents: finalCents
      })
      .eq('id', order.id)
      .select()
      .single();

    if (!error && data) {
      setOrder(data);
    }
  };

  const handleCardSelect = async () => {
    setMethod('card');
    setIbanError(null);
    
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      setIbanError('Kartično plaćanje nije konfigurirano (nedostaje Stripe ključ). Molimo koristite IBAN uplatu.');
      return;
    }

    setLoadingSecret(true);
    try {
      const savedDiscount = localStorage.getItem(`appliedDiscount_${order.id}`);
      const discountCode = savedDiscount ? JSON.parse(savedDiscount).code : undefined;

      const res = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId: order.id,
          discountCode: discountCode
        }),
      });
      const data = await res.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setAmounts({ base: data.baseAmount, total: data.amountToPay });
      } else if (data.error) {
        setIbanError(`Greška kod kartičnog plaćanja: ${data.error}`);
      }
    } catch (err) {
      console.error('Failed to create payment intent', err);
      setIbanError('Neuspjelo povezivanje sa Stripe servisom.');
    }
    setLoadingSecret(false);
  };

  const handleIbanSelect = () => {
    setMethod('iban');
    setIbanError(null);
  };

  const handleIbanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ibanProof) {
      setIbanError('Molimo priložite potvrdu o uplati.');
      return;
    }

    setIbanLoading(true);
    setIbanError(null);

    try {
      // Upload proof
      const fileExt = ibanProof.name.split('.').pop();
      const fileName = `iban_proof_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${order.id}/payments/${fileName}`;

      const formData = new FormData();
      formData.append('file', ibanProof);
      formData.append('filePath', filePath);
      formData.append('bucket', 'orders');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Greška pri prijenosu potvrde');
      }

      // Create payment record
      const { error: dbError } = await supabase.from('payments').insert({
        order_id: order.id,
        method: 'iban',
        stage: order.payment_model === '50-50' ? 'deposit' : 'full',
        amount_cents: amountToPay,
        status: 'pending',
        iban_proof_url: filePath,
        confirmed_by_admin: false,
      });

      if (dbError) throw dbError;

      // Update order status
      await supabase.from('orders').update({ status: 'Čeka uplatu' }).eq('id', order.id);

      router.push(`/dashboard/narudzbe/${order.id}?payment=iban_submitted`);
    } catch (err: any) {
      console.error('IBAN error:', err);
      setIbanError(err.message || 'Došlo je do pogreške.');
      setIbanLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Model plaćanja selection */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-zinc-200">
        <h2 className="text-xl font-bold text-zinc-900 mb-6">Odaberite model plaćanja</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => updateOrderModel('100%')}
            className={`p-4 rounded-xl border text-left transition-all ${
              paymentModel === '100%'
                ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600 ring-opacity-50'
                : 'border-zinc-200 hover:border-zinc-300'
            }`}
          >
            <div className="font-bold text-zinc-900">Plaćanje u cijelosti (100%)</div>
            <div className="text-sm text-zinc-500 mt-1">Platite cijeli iznos odmah i preuzmite rad čim bude gotov.</div>
            <div className="mt-4 text-lg font-bold text-indigo-600">{(order.total_cents / 100).toFixed(2)} €</div>
          </button>

          <button
            onClick={() => updateOrderModel('50-50')}
            className={`p-4 rounded-xl border text-left transition-all ${
              paymentModel === '50-50'
                ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600 ring-opacity-50'
                : 'border-zinc-200 hover:border-zinc-300'
            }`}
          >
            <div className="font-bold text-zinc-900">Plaćanje na rate (50% + 50%)</div>
            <div className="text-sm text-zinc-500 mt-1">Platite 50% sada, a preostalih 50% nakon što pregledate rad.</div>
            <div className="mt-4 text-lg font-bold text-indigo-600">{(Math.floor(order.total_cents / 2) / 100).toFixed(2)} €</div>
          </button>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-zinc-200">
        <h2 className="text-xl font-bold text-zinc-900 mb-6">Odaberite način plaćanja</h2>
        
        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4 mb-8">
        <button
          onClick={handleCardSelect}
          className={`w-full md:flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-colors border flex items-center justify-center space-x-2 ${
            method === 'card' 
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
              : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
          }`}
        >
          <span>Kartična naplata</span>
        </button>
        <button
          onClick={handleIbanSelect}
          className={`w-full md:flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-colors border flex items-center justify-center space-x-2 ${
            method === 'iban' 
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
              : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
          }`}
        >
          <span>Bankovna uplata (IBAN)</span>
        </button>
      </div>

      {ibanError && method === 'card' && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
          {ibanError}
        </div>
      )}

      {method === 'card' && (
        <div>
          {!clientSecret && !loadingSecret && (
            <button 
              onClick={handleCardSelect}
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm text-lg"
            >
              Učitaj kartično plaćanje
            </button>
          )}
          {loadingSecret && <p className="text-center text-zinc-500">Učitavanje...</p>}
          {clientSecret && amounts && (
            <div className="mb-6 bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-sm text-indigo-900">
              <div className="flex justify-between mb-1">
                <span>Osnovni iznos:</span>
                <span>{(amounts.base / 100).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Stripe naknada (2.9% + 0.30€):</span>
                <span>{((amounts.total - amounts.base) / 100).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between font-bold pt-2 border-t border-indigo-200">
                <span>Ukupno za platiti:</span>
                <span>{(amounts.total / 100).toFixed(2)} €</span>
              </div>
            </div>
          )}
          {clientSecret && (
            <Elements 
              options={{ 
                clientSecret, 
                appearance: { theme: 'stripe' },
              }} 
              stripe={stripePromise}
            >
              <CheckoutForm clientSecret={clientSecret} orderId={order.id} amount={amounts?.total || amountToPay} />
            </Elements>
          )}
        </div>
      )}

      {method === 'iban' && (
        <form onSubmit={handleIbanSubmit} className="space-y-6">
          <div className="bg-zinc-50 p-6 rounded-xl border border-zinc-200">
            <h3 className="font-bold text-zinc-900 mb-4">Podaci za uplatu</h3>
            <div className="space-y-2 text-sm text-zinc-700">
              <p><span className="font-medium">Primatelj:</span> {appSettings?.iban_recipient}</p>
              <p><span className="font-medium">IBAN:</span> {appSettings?.iban_number}</p>
              <p><span className="font-medium">Banka:</span> {appSettings?.iban_bank}</p>
              <p><span className="font-medium">Iznos:</span> {(amountToPay / 100).toFixed(2)} €</p>
              <p><span className="font-medium">Poziv na broj:</span> {new Date(order.created_at).toLocaleDateString('hr-HR').replace(/\./g, '')}</p>
              <p><span className="font-medium">Opis plaćanja:</span> Narudžba od {new Date(order.created_at).toLocaleDateString('hr-HR')}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Priložite potvrdu o uplati (PDF, JPG, PNG)
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setIbanProof(e.target.files?.[0] || null)}
              className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>

          {ibanError && <div className="text-red-500 text-sm">{ibanError}</div>}

          <button
            type="submit"
            disabled={ibanLoading || !ibanProof}
            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm text-lg disabled:opacity-70"
          >
            {ibanLoading ? 'Slanje...' : 'Pošalji potvrdu o uplati'}
          </button>
        </form>
      )}
      </div>
    </div>
  );
}
