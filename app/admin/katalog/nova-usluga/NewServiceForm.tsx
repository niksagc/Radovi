'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewServiceForm({ categories, initialCategoryId }: { categories: any[], initialCategoryId?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const category_id = formData.get('category_id') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const price_cents = Math.round(parseFloat(formData.get('price') as string) * 100);
    const is_addon = formData.get('is_addon') === 'true';
    const type = is_addon ? 'addon' : 'base';
    const is_active = formData.get('is_active') === 'true';
    const max_pages = formData.get('max_pages') ? parseInt(formData.get('max_pages') as string, 10) : null;
    const included_revisions = formData.get('included_revisions') ? parseInt(formData.get('included_revisions') as string, 10) : 0;

    try {
      const { error: insertError } = await supabase
        .from('items')
        .insert({
          category_id,
          name,
          description,
          price_cents,
          type,
          is_active,
          max_pages,
          included_revisions,
        });

      if (insertError) throw insertError;

      router.push('/admin/katalog');
      router.refresh();
    } catch (err: any) {
      console.error('Error creating item:', err);
      setError(err.message || err.details || err.hint || 'Greška pri kreiranju usluge.');
    }
    
    setLoading(false);
  };

  return (
    <>
      <div className="mb-6">
        <Link href="/admin/katalog" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Natrag na katalog
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-zinc-900 mb-8">Nova usluga</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Kategorija *</label>
            <select
              name="category_id"
              defaultValue={initialCategoryId || ''}
              required
              className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="" disabled>Odaberite kategoriju</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Naziv usluge *</label>
            <input
              type="text"
              name="name"
              required
              className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Opis</label>
          <textarea
            name="description"
            rows={3}
            className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
          ></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Cijena (€) *</label>
            <input
              type="number"
              name="price"
              step="0.01"
              min="0"
              required
              className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Max stranica/slajdova</label>
            <input
              type="number"
              name="max_pages"
              min="1"
              className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        
        <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm">
          <strong>Napomena:</strong> Izrada je u roku 5-10 dana od potvrde narudžbe.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Uključene revizije</label>
            <input
              type="number"
              name="included_revisions"
              defaultValue="0"
              min="0"
              className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Tip usluge</label>
            <select
              name="is_addon"
              className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="false">Osnovna usluga</option>
              <option value="true">Dodatak (Add-on)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Status</label>
          <select
            name="is_active"
            className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="true">Aktivno</option>
            <option value="false">Neaktivno</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm text-sm disabled:opacity-70"
        >
          {loading ? 'Spremanje...' : 'Spremi uslugu'}
        </button>
      </form>
    </>
  );
}
