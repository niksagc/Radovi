'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function StudentSettingsForm({ initialProfile, initialSettings }: { initialProfile: any, initialSettings: any }) {
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
    const profileUpdates = {
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      phone: formData.get('phone') as string,
    };

    const settingsUpdates = {
      email_notifications: formData.get('email_notifications') === 'on',
    };

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', initialProfile.id);

      if (profileError) throw profileError;

      if (initialSettings) {
        const { error: settingsError } = await supabase
          .from('user_settings')
          .update(settingsUpdates)
          .eq('user_id', initialProfile.id);

        if (settingsError) throw settingsError;
      } else {
        const { error: settingsError } = await supabase
          .from('user_settings')
          .insert({ user_id: initialProfile.id, ...settingsUpdates });

        if (settingsError) throw settingsError;
      }

      setSuccess(true);
      router.refresh();
    } catch (err: any) {
      console.error('Settings update error:', err);
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Ime</label>
          <input
            type="text"
            name="first_name"
            defaultValue={initialProfile?.first_name}
            required
            className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Prezime</label>
          <input
            type="text"
            name="last_name"
            defaultValue={initialProfile?.last_name}
            required
            className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">Broj telefona</label>
        <input
          type="tel"
          name="phone"
          defaultValue={initialProfile?.phone}
          className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="pt-6 border-t border-zinc-200">
        <h3 className="text-lg font-bold text-zinc-900 mb-4">Obavijesti</h3>
        <div className="flex items-center">
          <input
            type="checkbox"
            name="email_notifications"
            id="email_notifications"
            defaultChecked={initialSettings?.email_notifications !== false}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-zinc-300 rounded"
          />
          <label htmlFor="email_notifications" className="ml-2 block text-sm text-zinc-900">
            Želim primati email obavijesti o statusu narudžbi
          </label>
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
