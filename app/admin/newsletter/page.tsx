'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AdminNewsletterPage() {
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const supabase = createClient();

  const fetchTemplates = useCallback(async () => {
    const { data } = await supabase.from('email_templates').select('*');
    if (data) setTemplates(data);
  }, [supabase]);

  const fetchSubscribers = useCallback(async () => {
    const { data } = await supabase.from('newsletter_subscribers').select('*').order('created_at', { ascending: false });
    if (data) setSubscribers(data);
  }, [supabase]);

  useEffect(() => {
    fetchTemplates();
    fetchSubscribers();
  }, [fetchTemplates, fetchSubscribers]);

  const saveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const { error } = await supabase.from('email_templates').insert({
      name: formData.get('name'),
      html_content: formData.get('html_content'),
      start_date: formData.get('start_date'),
      end_date: formData.get('end_date'),
    });
    if (error) setMessage({ type: 'error', text: error.message });
    else {
      setMessage({ type: 'success', text: 'Predložak spremljen!' });
      fetchTemplates();
    }
  };

  const sendNewsletter = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/send-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, html }),
      });
      if (!response.ok) throw new Error('Greška pri slanju');
      setMessage({ type: 'success', text: 'Newsletter poslan!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Newsletter Manager</h1>

      {/* Forma za slanje */}
      <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
        <h2 className="text-xl font-semibold mb-4">Slanje</h2>
        <input className="w-full border p-2 mb-2 rounded" placeholder="Naslov" value={subject} onChange={e => setSubject(e.target.value)} />
        <textarea className="w-full border p-2 mb-2 rounded h-32" placeholder="HTML" value={html} onChange={e => setHtml(e.target.value)} />
        <button onClick={sendNewsletter} className="bg-indigo-600 text-white px-4 py-2 rounded">Pošalji</button>
      </div>

      {/* Forma za spremanje predloška */}
      <form onSubmit={saveTemplate} className="bg-white p-6 rounded-xl shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Spremi novi predložak</h2>
        <input name="name" className="w-full border p-2 mb-2 rounded" placeholder="Ime predloška" required />
        <textarea name="html_content" className="w-full border p-2 mb-2 rounded h-32" placeholder="HTML sadržaj predloška" required />
        <input name="start_date" type="date" className="w-full border p-2 mb-2 rounded" />
        <input name="end_date" type="date" className="w-full border p-2 mb-2 rounded" />
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Spremi predložak</button>
      </form>

      {/* Lista predložaka */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Postojeći predlošci</h2>
        <div className="grid gap-4">
          {templates.map(t => (
            <div key={t.id} className="bg-white p-4 rounded border flex justify-between items-center">
              <span>{t.name} ({t.start_date} - {t.end_date})</span>
              <button onClick={() => {
                console.log('Loading template:', t);
                setHtml(t.html_content);
              }} className="text-indigo-600 cursor-pointer hover:underline">Učitaj</button>
            </div>
          ))}
        </div>
      </div>

      {/* Lista pretplatnika */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Newsletter pretplatnici ({subscribers.length})</h2>
        <div className="bg-white p-4 rounded border">
          <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 text-sm font-mono break-all">
            {subscribers.map((s) => s.email).join(', ')}
          </div>
        </div>
      </div>
    </div>
  );
}
