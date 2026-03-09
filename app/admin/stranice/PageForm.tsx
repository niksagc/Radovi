'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function PageForm({ initialData }: { initialData?: any }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    content: initialData?.content || '',
    is_published: initialData?.is_published ?? false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (initialData?.id) {
        const { error } = await supabase
          .from('pages')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', initialData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pages')
          .insert([formData]);
        if (error) throw error;
      }

      router.push('/admin/stranice');
      router.refresh();
    } catch (err: any) {
      console.error('Error saving page:', err);
      let msg = err.message || 'Greška pri spremanju stranice.';
      if (msg.includes('public.pages')) {
        msg = 'Tablica "pages" nije pronađena u bazi podataka. Molimo kontaktirajte podršku ili pokrenite SQL migraciju za CMS stranice u Supabase SQL Editoru.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    if (!confirm('Jeste li sigurni da želite obrisati ovu stranicu?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', initialData.id);
      if (error) throw error;
      router.push('/admin/stranice');
      router.refresh();
    } catch (err: any) {
      console.error('Error deleting page:', err);
      setError(err.message || 'Greška pri brisanju stranice.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Naslov stranice</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Npr. O nama"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Slug (URL putanja)</label>
          <div className="flex items-center">
            <span className="text-zinc-400 mr-2 text-sm">/p/</span>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
              className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="o-nama"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Sadržaj (Markdown podržan)</label>
          <textarea
            required
            rows={15}
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
            placeholder="Unesite sadržaj stranice..."
          ></textarea>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_published"
            checked={formData.is_published}
            onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
            className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="is_published" className="text-sm font-medium text-zinc-700 cursor-pointer">
            Objavi stranicu (učini vidljivom javno)
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-70"
          >
            {loading ? 'Spremanje...' : 'Spremi stranicu'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-white border border-zinc-300 text-zinc-700 px-6 py-2 rounded-xl font-bold hover:bg-zinc-50 transition-colors"
          >
            Odustani
          </button>
        </div>

        {initialData?.id && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="text-red-600 hover:text-red-800 font-medium text-sm flex items-center gap-1"
          >
            Obriši stranicu
          </button>
        )}
      </div>
    </form>
  );
}
