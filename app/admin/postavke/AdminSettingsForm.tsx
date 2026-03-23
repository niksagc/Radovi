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

  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testEmailSuccess, setTestEmailSuccess] = useState<string | null>(null);
  const [testEmailError, setTestEmailError] = useState<string | null>(null);

  const handleTestEmail = async () => {
    setTestEmailLoading(true);
    setTestEmailSuccess(null);
    setTestEmailError(null);

    const emailInput = document.querySelector('input[name="notification_emails"]') as HTMLInputElement;
    const email = emailInput?.value;

    if (!email) {
      setTestEmailError('Unesite email adresu za obavijesti prije testiranja.');
      setTestEmailLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setTestEmailSuccess(data.message || 'Probni e-mail uspješno poslan!');
      } else {
        setTestEmailError(data.error || 'Došlo je do greške pri slanju e-maila.');
      }
    } catch (err: any) {
      setTestEmailError('Greška u komunikaciji sa serverom.');
    }

    setTestEmailLoading(false);
  };

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
      facebook_url: formData.get('facebook_url') as string,
      instagram_url: formData.get('instagram_url') as string,
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
        <label className="block text-sm font-medium text-zinc-700 mb-1">Email za obavijesti (Primatelj)</label>
        <div className="flex gap-2">
          <input
            type="email"
            name="notification_emails"
            defaultValue={initialSettings?.notification_emails?.[0]}
            required
            className="flex-1 rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Vaš email za primanje obavijesti"
          />
          <button
            type="button"
            onClick={handleTestEmail}
            disabled={testEmailLoading}
            className="px-4 py-2 bg-zinc-100 text-zinc-700 font-medium rounded-xl hover:bg-zinc-200 transition-colors shadow-sm text-sm disabled:opacity-70 whitespace-nowrap"
          >
            {testEmailLoading ? 'Slanje...' : 'Pošalji probni e-mail'}
          </button>
        </div>
        <p className="mt-1 text-xs text-zinc-500">Na ovu adresu ćete primati obavijesti o novim narudžbama i upitima.</p>
        {testEmailError && (
          <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded-xl">
            <p className="text-sm text-red-600 font-medium">Greška pri slanju:</p>
            <p className="text-xs text-red-500 mt-1">{testEmailError}</p>
            <div className="mt-2 text-xs text-zinc-600 space-y-1">
              <p>• Provjerite jesu li <strong>SMTP_USER</strong> i <strong>SMTP_PASS</strong> ispravno postavljeni u postavkama (Secrets).</p>
              <p>• Za Zoho Mail, preporučuje se korištenje <strong>App Password</strong> umjesto obične lozinke.</p>
            </div>
          </div>
        )}
        {testEmailSuccess && (
          <p className="mt-2 text-sm text-emerald-600 font-medium">{testEmailSuccess}</p>
        )}
      </div>

      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
        <h3 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Konfiguracija Zoho Mail-a
        </h3>
        <div className="text-xs text-indigo-800 space-y-2">
          <p>Da biste koristili Zoho Mail za slanje e-mailova, postavite sljedeće u AI Studio postavkama (Secrets):</p>
          <ul className="list-disc list-inside space-y-1 ml-1">
            <li><strong>SMTP_HOST</strong>: <code className="bg-indigo-100 px-1 rounded">smtp.zoho.eu</code> (ili .com)</li>
            <li><strong>SMTP_PORT</strong>: <code className="bg-indigo-100 px-1 rounded">465</code></li>
            <li><strong>SMTP_USER</strong>: Vaša puna email adresa (npr. <code className="bg-indigo-100 px-1 rounded">info@studyworks.work.gd</code>)</li>
            <li><strong>SMTP_PASS</strong>: Vaš Zoho <strong>App Password</strong> (ne obična lozinka)</li>
            <li><strong>FROM_EMAIL</strong>: Vaša Zoho email adresa</li>
          </ul>
          <p className="mt-2 font-medium">Napomena: App Password možete generirati u Zoho postavkama pod &quot;Security&quot; &rarr; &quot;App Passwords&quot;.</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-zinc-900">Društvene mreže</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Facebook URL</label>
            <input
              type="url"
              name="facebook_url"
              defaultValue={initialSettings?.facebook_url}
              className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="https://facebook.com/..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Instagram URL</label>
            <input
              type="url"
              name="instagram_url"
              defaultValue={initialSettings?.instagram_url}
              className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="https://instagram.com/..."
            />
          </div>
        </div>
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
