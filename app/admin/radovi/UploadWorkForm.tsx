'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function UploadWorkForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const file = formData.get('file') as File;

    if (!file) {
      setError('Molimo odaberite PDF datoteku.');
      setLoading(false);
      return;
    }

    try {
      // 1. Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('portfolio')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: urlData } = supabase.storage
        .from('portfolio')
        .getPublicUrl(fileName);

      // 3. Insert record into database
      const { error: insertError } = await supabase
        .from('portfolio_works')
        .insert([{
          title,
          description,
          file_url: urlData.publicUrl,
        }]);

      if (insertError) throw insertError;

      setSuccess(true);
      router.refresh();
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Greška pri učitavanju rada.');
    }
    
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm">Rad je uspješno učitan.</div>}

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">Naziv rada</label>
        <input type="text" name="title" required className="w-full rounded-xl border border-zinc-300 px-4 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">Opis</label>
        <textarea name="description" className="w-full rounded-xl border border-zinc-300 px-4 py-2" rows={3} />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">PDF datoteka</label>
        <input type="file" name="file" accept=".pdf" required className="w-full" />
      </div>
      <button type="submit" disabled={loading} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
        {loading ? 'Učitavanje...' : 'Učitaj rad'}
      </button>
    </form>
  );
}
