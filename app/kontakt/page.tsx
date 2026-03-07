'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const subject = formData.get('subject') as string;
    const deadline = formData.get('deadline') as string;
    const message = formData.get('message') as string;

    try {
      // 1. Insert contact
      const { data: contact, error: contactError } = await supabase
        .from('preorder_contacts')
        .insert({
          name,
          email,
          subject,
          deadline: deadline ? new Date(deadline).toISOString() : null,
          message,
        })
        .select()
        .single();

      if (contactError) throw contactError;

      // 2. Upload file if exists
      if (file && contact) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${contact.id}/${fileName}`;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('filePath', filePath);
        formData.append('bucket', 'preorders');

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Greška pri prijenosu datoteke');
        }

        const { error: dbError } = await supabase.from('files').insert({
          preorder_contact_id: contact.id,
          kind: 'preorder',
          path: filePath,
          filename: file.name,
          size_bytes: file.size,
        });

        if (dbError) throw dbError;
      }

      setSuccess(true);
      (e.target as HTMLFormElement).reset();
      setFile(null);
    } catch (err: any) {
      console.error('Contact error:', err);
      setError(err.message || 'Došlo je do pogreške prilikom slanja upita.');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-indigo-600 tracking-tight">
              StudyWorks
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/kategorije" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
              Katalog
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 mb-4 text-center">
          Zatražite ponudu
        </h1>
        <p className="text-zinc-600 text-center mb-8">
          Niste sigurni koja usluga vam treba? Pošaljite nam upit i rado ćemo vam pomoći.
        </p>

        {success ? (
          <div className="bg-green-50 border border-green-200 p-8 rounded-2xl text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">Upit uspješno poslan!</h2>
            <p className="text-zinc-600 mb-6">Javit ćemo vam se u najkraćem mogućem roku na vašu email adresu.</p>
            <Link href="/" className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors">
              Povratak na naslovnicu
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Ime i prezime *</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Email adresa *</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Predmet / Tema rada</label>
                <input
                  type="text"
                  name="subject"
                  className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Željeni rok</label>
                <input
                  type="date"
                  name="deadline"
                  className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Vaša poruka *</label>
              <textarea
                name="message"
                required
                rows={5}
                className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Opišite što vam je potrebno..."
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Priložite datoteku (opcionalno)</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.png"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              <p className="mt-1 text-xs text-zinc-500">PDF, DOCX, PPTX, JPG, PNG (Max 10MB)</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm text-lg disabled:opacity-70"
            >
              {loading ? 'Slanje...' : 'Pošalji upit'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
