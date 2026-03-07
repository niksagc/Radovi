'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function AdminSettingsForm({ initialSettings }: { initialSettings: any }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const updates = {
      notification_emails: [formData.get('notification_emails') as string],
      iban_recipient: formData.get('iban_recipient') as string,
      iban_number: formData.get('iban_number') as string,
      iban_bank: formData.get('iban_bank') as string,
      cancellation_days: parseInt(formData.get('cancellation_days') as string, 10),
      final_payment_deadline_hours: parseInt(formData.get('final_payment_deadline_hours') as string, 10) * 24,
    };

    try {
      const { error: updateError } = await supabase
        .from('app_settings')
        .upsert({
          id: 1,
          ...updates
        });

      if (updateError) throw updateError;

      setSuccess(true);
      router.refresh();
    } catch (err: any) {
      console.error('Settings update error:', JSON.stringify(err));
      setError(err.message || 'Greška pri spremanju postavki.');
    }
    
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm">
          Postavke su uspješno spremljene.
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">Email za obavijesti</label>
        <input
          type="email"
          name="notification_emails"
          defaultValue={initialSettings?.notification_emails?.[0]}
          required
          className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-zinc-900">IBAN Podaci za uplatu</h3>
        
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Primatelj (Naziv tvrtke/obrta)</label>
          <input
            type="text"
            name="iban_recipient"
            defaultValue={initialSettings?.iban_recipient}
            required
            className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">IBAN</label>
            <input
              type="text"
              name="iban_number"
              defaultValue={initialSettings?.iban_number}
              required
              className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Banka</label>
            <input
              type="text"
              name="iban_bank"
              defaultValue={initialSettings?.iban_bank}
              required
              className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Rok za otkazivanje (dani)</label>
          <input
            type="number"
            name="cancellation_days"
            defaultValue={initialSettings?.cancellation_days || 14}
            required
            min="0"
            className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Rok za finalnu uplatu (dani)</label>
          <input
            type="number"
            name="final_payment_deadline_hours"
            defaultValue={Math.floor((initialSettings?.final_payment_deadline_hours || 48) / 24)}
            required
            min="0"
            className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm text-sm disabled:opacity-70"
      >
        {loading ? 'Spremanje...' : 'Spremi postavke'}
      </button>
    </form>
  );
}
