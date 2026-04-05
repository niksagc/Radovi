'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function DiscountForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isUserSpecific, setIsUserSpecific] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    
    if (isUserSpecific) {
      const response = await fetch('/api/admin/generate-discount', {
        method: 'POST',
        body: JSON.stringify({
          emails: (formData.get('emails') as string).split(',').map(e => e.trim()),
          value: parseFloat(formData.get('value') as string),
          expiresAt: formData.get('expiresAt'),
          emailContent: formData.get('emailContent'),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Greška pri generiranju popusta.');
      } else {
        setSuccess(true);
        (e.target as HTMLFormElement).reset();
      }
    } else {
      const template = {
        name: formData.get('name') as string,
        value: parseFloat(formData.get('value') as string),
        expires_at: formData.get('expiresAt') || null,
        is_active: true,
        is_main_banner: formData.get('is_main_banner') === 'on',
      };

      try {
        const { error: insertError } = await supabase
          .from('discount_templates')
          .insert([template]);

        if (insertError) throw insertError;

        setSuccess(true);
        router.refresh();
        (e.target as HTMLFormElement).reset();
      } catch (err: any) {
        console.error('Template insert error:', err);
        setError(err.message || 'Greška pri dodavanju predloška.');
      }
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
          {isUserSpecific ? 'Popust je generiran i poslan korisniku.' : 'Popust je uspješno dodan.'}
        </div>
      )}

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isUserSpecific"
          checked={isUserSpecific}
          onChange={(e) => setIsUserSpecific(e.target.checked)}
          className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="isUserSpecific" className="text-sm font-medium text-zinc-700">Generiraj popust za određenog korisnika</label>
      </div>

      {!isUserSpecific ? (
        <>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Naziv popusta</label>
            <input
              type="text"
              name="name"
              required
              className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="npr. Popust za prvu narudžbu"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="is_main_banner"
              id="is_main_banner"
              className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="is_main_banner" className="text-sm font-medium text-zinc-700">Postavi kao glavni baner</label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Postotak (%)</label>
              <input
                type="number"
                name="value"
                required
                min="0"
                max="100"
                className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="npr. 10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Datum isteka (opcionalno)</label>
              <input
                type="date"
                name="expiresAt"
                className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Emailovi korisnika (odvojeni zarezom)</label>
            <textarea
              name="emails"
              required
              className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="korisnik1@email.com, korisnik2@email.com, ..."
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Tekst e-maila</label>
            <textarea
              name="emailContent"
              className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Poštovani, za vas smo generirali poseban kod za popust..."
              rows={5}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Postotak (%)</label>
              <input
                type="number"
                name="value"
                required
                min="0"
                max="100"
                className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="npr. 10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Datum isteka (opcionalno)</label>
              <input
                type="date"
                name="expiresAt"
                className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm text-sm disabled:opacity-70"
      >
        {loading ? 'Spremanje...' : (isUserSpecific ? 'Generiraj i pošalji popust' : 'Spremi popust')}
      </button>
    </form>
  );
}
