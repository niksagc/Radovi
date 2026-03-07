'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewCategoryPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    try {
      const { error: insertError } = await supabase
        .from('categories')
        .insert({ name, description });

      if (insertError) throw insertError;

      router.push('/admin/katalog');
      router.refresh();
    } catch (err: any) {
      console.error('Error creating category:', err);
      setError(err.message || 'Greška pri kreiranju kategorije.');
    }
    
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/katalog" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Natrag na katalog
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-zinc-900 mb-8">Nova kategorija</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Naziv kategorije *</label>
          <input
            type="text"
            name="name"
            required
            className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Opis</label>
          <textarea
            name="description"
            rows={3}
            className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm text-sm disabled:opacity-70"
        >
          {loading ? 'Spremanje...' : 'Spremi kategoriju'}
        </button>
      </form>
    </div>
  );
}
