'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function fetchCategory() {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching category:', error);
        setError('Kategorija nije pronađena.');
      } else {
        setCategory(data);
      }
      setLoading(false);
    }

    fetchCategory();
  }, [id, supabase]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    try {
      const { error: updateError } = await supabase
        .from('categories')
        .update({ name, description })
        .eq('id', id);

      if (updateError) throw updateError;

      router.push('/admin/katalog');
      router.refresh();
    } catch (err: any) {
      console.error('Error updating category:', err);
      setError(err.message || 'Greška pri spremanju kategorije.');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      router.push('/admin/katalog');
      router.refresh();
    } catch (err: any) {
      console.error('Error deleting category:', err);
      setError(err.message || 'Greška pri brisanju kategorije.');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (loading) return <div className="text-center py-12">Učitavanje...</div>;
  if (!category && !loading) return <div className="text-center py-12 text-red-500">Kategorija nije pronađena.</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/katalog" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Natrag na katalog
        </Link>
      </div>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Uredi kategoriju</h1>
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500 mr-2">Sigurno?</span>
            <button
              onClick={handleDelete}
              disabled={deleting || saving}
              className="px-4 py-2 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
            >
              {deleting ? 'Brisanje...' : 'Da, obriši'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              disabled={deleting || saving}
              className="px-4 py-2 bg-zinc-100 text-zinc-700 font-medium rounded-xl hover:bg-zinc-200 transition-colors text-sm disabled:opacity-50"
            >
              Odustani
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={deleting || saving}
            className="px-4 py-2 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-colors text-sm disabled:opacity-50"
          >
            Obriši kategoriju
          </button>
        )}
      </div>
      
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
            defaultValue={category.name}
            required
            className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Opis</label>
          <textarea
            name="description"
            defaultValue={category.description}
            rows={3}
            className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={saving || deleting}
          className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm text-sm disabled:opacity-70"
        >
          {saving ? 'Spremanje...' : 'Spremi promjene'}
        </button>
      </form>
    </div>
  );
}
