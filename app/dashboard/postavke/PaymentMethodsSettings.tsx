'use client';

import { useState, useEffect, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Trash2, CreditCard, Plus } from 'lucide-react';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) 
  : Promise.resolve(null);

function AddCardForm({ clientSecret, onSuccess, onCancel }: { clientSecret: string, onSuccess: () => void, onCancel: () => void }) {
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
    setError(null);

    const { error } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard/postavke`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setError(error.message || 'Došlo je do pogreške prilikom spremanja kartice.');
      setLoading(false);
    } else {
      // Success
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <PaymentElement />
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-70"
        >
          {loading ? 'Spremanje...' : 'Spremi karticu'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 bg-white border border-zinc-200 text-zinc-700 font-medium rounded-lg hover:bg-zinc-50 transition-colors"
        >
          Odustani
        </button>
      </div>
    </form>
  );
}

export default function PaymentMethodsSettings() {
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingNew, setAddingNew] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const fetchPaymentMethods = useCallback(async () => {
    try {
      const res = await fetch('/api/stripe/list-payment-methods');
      const data = await res.json();
      if (data.paymentMethods) {
        setPaymentMethods(data.paymentMethods);
      }
    } catch (err) {
      console.error('Failed to fetch payment methods', err);
      setError('Neuspjelo dohvaćanje kartica.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  const handleAddNew = async () => {
    setAddingNew(true);
    setSetupError(null);
    setError(null);
    try {
      const res = await fetch('/api/stripe/create-setup-intent', {
        method: 'POST',
      });
      
      let data;
      try {
        data = await res.json();
      } catch (e) {
        console.error('Failed to parse JSON response', e);
        setSetupError('Greška na serveru (invalid JSON).');
        return;
      }

      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        setSetupError(data.error || 'Neuspjelo inicijaliziranje spremanja kartice.');
      }
    } catch (err) {
      console.error('Failed to create setup intent', err);
      setSetupError('Došlo je do pogreške.');
    }
  };

  const handleSuccess = () => {
    setAddingNew(false);
    setClientSecret(null);
    setLoading(true);
    fetchPaymentMethods();
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/delete-payment-method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId: id }),
      });
      
      if (res.ok) {
        setConfirmDeleteId(null);
        await fetchPaymentMethods();
      } else {
        const data = await res.json();
        setError(data.error || 'Neuspjelo brisanje kartice.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to delete payment method', err);
      setError('Došlo je do pogreške prilikom brisanja.');
      setLoading(false);
    }
  };

  return (
    <div className="mt-10 pt-10 border-t border-zinc-200">
      <h2 className="text-xl font-bold text-zinc-900 mb-4">Spremljene kartice</h2>
      <p className="text-sm text-zinc-500 mb-6">
        Upravljajte svojim spremljenim karticama za brže plaćanje budućih narudžbi. 
        <span className="block mt-1 text-xs italic text-zinc-400">
          Napomena: Za promjenu podataka o kartici, molimo obrišite postojeću i dodajte novu.
        </span>
      </p>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-4 text-zinc-500">Učitavanje...</div>
      ) : (
        <div className="space-y-4">
          {paymentMethods.length > 0 ? (
            <div className="grid gap-4">
              {paymentMethods.map((pm) => (
                <div key={pm.id} className="flex items-center justify-between p-4 border border-zinc-200 rounded-xl bg-white">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-zinc-100 rounded-lg text-zinc-600">
                      <CreditCard size={24} />
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900 capitalize">
                        {pm.brand} •••• {pm.last4}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Istječe {pm.exp_month}/{pm.exp_year}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {confirmDeleteId === pm.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDelete(pm.id)}
                          className="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Potvrdi brisanje
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-3 py-1 bg-zinc-100 text-zinc-600 text-xs font-medium rounded-lg hover:bg-zinc-200 transition-colors"
                        >
                          Odustani
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setConfirmDeleteId(pm.id)}
                          className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                          title="Obriši karticu"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500 italic">Nemate spremljenih kartica.</p>
          )}
        </div>
      )}

      {!addingNew ? (
        <button
          onClick={handleAddNew}
          className="mt-6 flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          <Plus size={18} />
          Dodaj novu karticu
        </button>
      ) : (
        <div className="mt-6 p-4 border border-indigo-100 bg-indigo-50/30 rounded-xl">
          <h3 className="font-medium text-zinc-900 mb-2">Dodavanje nove kartice</h3>
          {setupError && <div className="text-red-500 text-sm mb-2">{setupError}</div>}
          {clientSecret ? (
             <Elements options={{ clientSecret, appearance: { theme: 'stripe' } }} stripe={stripePromise}>
               <AddCardForm clientSecret={clientSecret} onSuccess={handleSuccess} onCancel={() => setAddingNew(false)} />
             </Elements>
          ) : (
            <div className="text-sm text-zinc-500">Inicijalizacija...</div>
          )}
        </div>
      )}
    </div>
  );
}
