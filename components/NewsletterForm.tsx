'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert([{ email }]);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Hvala na prijavi!' });
      setEmail('');
    } catch (err: any) {
      console.error('Newsletter error:', err);
      setMessage({ type: 'error', text: 'Došlo je do greške, pokušajte ponovo.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full max-w-sm">
      <label className="text-sm font-medium text-zinc-700">Prijavite se na newsletter</label>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Vaša e-mail adresa"
          required
          className="flex-1 rounded-xl border border-zinc-300 px-4 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors"
        >
          {loading ? '...' : 'Prijava'}
        </button>
      </div>
      {message && (
        <p className={`text-xs ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
    </form>
  );
}
