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
  const [method, setMethod] = useState<'card' | 'iban' | 'keks' | 'aircash'>('card');
  const [amounts, setAmounts] = useState<{ base: number, total: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [ibanProof, setIbanProof] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const amountToPay = paymentModel === '50-50' ? order.deposit_cents : order.total_cents;

  const getIconUrl = (path: string | null, fallback: string) => {
    if (!path) return fallback;
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/orders/${path}`;
  };

  const updateOrderModel = async (model: '100%' | '50-50') => {
    setPaymentModel(model);
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

  const handleStripeCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const savedDiscount = localStorage.getItem(`appliedDiscount_${order.id}`);
      let discountCode = undefined;
      
      if (savedDiscount && savedDiscount !== 'null') {
        try {
          const parsed = JSON.parse(savedDiscount);
          discountCode = parsed?.code;
        } catch (e) {
          console.error('Error parsing discount from localStorage', e);
        }
      }

      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId: order.id,
          discountCode: discountCode
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Greška pri kreiranju sesije plaćanja.');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Neuspjelo povezivanje sa Stripe servisom.');
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ibanProof) {
      setError('Molimo priložite potvrdu o uplati.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fileExt = ibanProof.name.split('.').pop();
      const fileName = `${method}_proof_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
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

      const { error: dbError } = await supabase.from('payments').insert({
        order_id: order.id,
        method: method === 'iban' ? 'iban' : 'card', // We treat Keks/Aircash as manual card/mobile payments
        stage: order.payment_model === '50-50' ? 'deposit' : 'full',
        amount_cents: amountToPay,
        status: 'pending',
        iban_proof_url: filePath,
        confirmed_by_admin: false,
      });

      if (dbError) throw dbError;

      await supabase.from('orders').update({ status: 'Čeka uplatu' }).eq('id', order.id);
      router.push(`/dashboard/narudzbe/${order.id}?payment=${method}_submitted`);
    } catch (err: any) {
      console.error('Manual payment error:', err);
      setError(err.message || 'Došlo je do pogreške.');
      setLoading(false);
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
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <button
            onClick={() => { setMethod('card'); setError(null); }}
            className={`py-3 px-2 rounded-xl font-medium text-xs transition-colors border flex flex-col items-center justify-center space-y-2 ${
              method === 'card' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            <div className="flex space-x-1">
              <img src={getIconUrl(appSettings?.visa_icon_url, "https://images.weserv.nl/?url=https://www.vectorlogo.zone/logos/visa/visa-ar21.svg")} className="h-4" alt="Visa" />
              <img src={getIconUrl(appSettings?.mastercard_icon_url, "https://images.weserv.nl/?url=https://www.vectorlogo.zone/logos/mastercard/mastercard-ar21.svg")} className="h-4" alt="Mastercard" />
            </div>
            <span>Kartica / GPay / Apple Pay</span>
          </button>
          
          <button
            onClick={() => { setMethod('iban'); setError(null); }}
            className={`py-3 px-2 rounded-xl font-medium text-xs transition-colors border flex flex-col items-center justify-center space-y-2 ${
              method === 'iban' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
            <span>IBAN Uplata</span>
          </button>

          <button
            onClick={() => { setMethod('keks'); setError(null); }}
            className={`py-3 px-2 rounded-xl font-medium text-xs transition-colors border flex flex-col items-center justify-center space-y-2 ${
              method === 'keks' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            <img src={getIconUrl(appSettings?.keks_pay_icon_url, "https://images.weserv.nl/?url=https://kekspay.hr/wp-content/uploads/2018/12/keks-pay-logo.png")} className="h-5 object-contain" alt="KEKS Pay" />
            <span>KEKS Pay</span>
          </button>

          <button
            onClick={() => { setMethod('aircash'); setError(null); }}
            className={`py-3 px-2 rounded-xl font-medium text-xs transition-colors border flex flex-col items-center justify-center space-y-2 ${
              method === 'aircash' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            <img src={getIconUrl(appSettings?.aircash_icon_url, "https://images.weserv.nl/?url=https://aircash.eu/wp-content/uploads/2021/03/aircash-logo-new.png")} className="h-5 object-contain" alt="Aircash" />
            <span>Aircash</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {method === 'card' && (
          <div className="space-y-6">
            <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-200 text-center">
              <p className="text-zinc-600 mb-6 text-sm">
                Bit ćete preusmjereni na sigurnu Stripe stranicu za plaćanje gdje možete koristiti kartice, Google Pay, Apple Pay ili PayPal.
              </p>
              <div className="flex justify-center items-center space-x-4 mb-8 grayscale opacity-50">
                <img src={getIconUrl(appSettings?.visa_icon_url, "https://images.weserv.nl/?url=https://www.vectorlogo.zone/logos/visa/visa-ar21.svg")} className="h-6" alt="Visa" />
                <img src={getIconUrl(appSettings?.mastercard_icon_url, "https://images.weserv.nl/?url=https://www.vectorlogo.zone/logos/mastercard/mastercard-ar21.svg")} className="h-6" alt="Mastercard" />
                <img src={getIconUrl(appSettings?.google_pay_icon_url, "https://images.weserv.nl/?url=https://www.vectorlogo.zone/logos/google_pay/google_pay-ar21.svg")} className="h-6" alt="Google Pay" />
                <img src={getIconUrl(appSettings?.apple_pay_icon_url, "https://images.weserv.nl/?url=https://www.vectorlogo.zone/logos/apple_pay/apple_pay-ar21.svg")} className="h-6" alt="Apple Pay" />
              </div>
              <button 
                onClick={handleStripeCheckout}
                disabled={loading}
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm text-lg disabled:opacity-70"
              >
                {loading ? 'Učitavanje...' : 'Nastavi na sigurno plaćanje'}
              </button>
            </div>
            <p className="text-center text-xs text-zinc-400">
              Powered by <span className="font-bold">stripe</span>
            </p>
          </div>
        )}

        {(method === 'iban' || method === 'keks' || method === 'aircash') && (
          <form onSubmit={handleManualSubmit} className="space-y-6">
            <div className="bg-zinc-50 p-6 rounded-xl border border-zinc-200">
              <h3 className="font-bold text-zinc-900 mb-4">
                {method === 'iban' ? 'Podaci za IBAN uplatu' : method === 'keks' ? 'Podaci za KEKS Pay' : 'Podaci za Aircash'}
              </h3>
              <div className="space-y-2 text-sm text-zinc-700">
                {method === 'iban' ? (
                  <>
                    <p><span className="font-medium">Primatelj:</span> {appSettings?.iban_recipient}</p>
                    <p><span className="font-medium">IBAN:</span> {appSettings?.iban_number}</p>
                    <p><span className="font-medium">Banka:</span> {appSettings?.iban_bank}</p>
                  </>
                ) : (
                  <>
                    <p><span className="font-medium">Primatelj:</span> {appSettings?.iban_recipient}</p>
                    <p><span className="font-medium">Broj mobitela:</span> {appSettings?.phone || '091 234 5678'}</p>
                  </>
                )}
                <p><span className="font-medium">Iznos:</span> {(amountToPay / 100).toFixed(2)} €</p>
                <p><span className="font-medium">Poziv na broj:</span> {new Date(order.created_at).toLocaleDateString('hr-HR').replace(/\./g, '')}</p>
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

            <button
              type="submit"
              disabled={loading || !ibanProof}
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm text-lg disabled:opacity-70"
            >
              {loading ? 'Slanje...' : 'Pošalji potvrdu o uplati'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
