'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AdminNewsletterPage() {
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const sendNewsletter = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch('/api/send-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, html }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: 'Newsletter uspješno poslan!' });
      setSubject('');
      setHtml('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-zinc-900 mb-8">Newsletter</h1>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200 mb-8">
        <h2 className="text-xl font-semibold mb-4">Pošalji newsletter</h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Naslov e-maila"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 px-4 py-2"
          />
          <textarea
            placeholder="HTML sadržaj e-maila"
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 px-4 py-2 h-40"
          />
          <button
            onClick={sendNewsletter}
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            {loading ? 'Slanje...' : 'Pošalji svima'}
          </button>
          {message && (
            <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {message.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
