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

  const [preview, setPreview] = useState(false);
  const [file, setFile] = useState<File | null>(null);

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

  const loadTemplate = (template: any) => {
    setHtml(template.html_content);
    setSubject(template.name);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteTemplate = async (id: number) => {
    if (!confirm('Jeste li sigurni da želite obrisati ovaj predložak?')) return;
    const { error } = await supabase.from('email_templates').delete().eq('id', id);
    if (error) setMessage({ type: 'error', text: error.message });
    else {
      setMessage({ type: 'success', text: 'Predložak obrisan!' });
      fetchTemplates();
    }
  };

  const saveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    let imageUrl = '';
    
    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('newsletter-images')
        .upload(fileName, file);
      if (error) {
        setMessage({ type: 'error', text: 'Greška pri uploadu slike: ' + error.message });
        return;
      }
      const { data: publicUrlData } = supabase.storage
        .from('newsletter-images')
        .getPublicUrl(fileName);
      imageUrl = publicUrlData.publicUrl;
    }

    const { error } = await supabase.from('email_templates').insert({
      name: formData.get('name'),
      html_content: formData.get('html_content'),
      image_url: imageUrl || formData.get('image_url'),
      start_date: formData.get('start_date'),
      end_date: formData.get('end_date'),
    });
    if (error) setMessage({ type: 'error', text: error.message });
    else {
      setMessage({ type: 'success', text: 'Predložak spremljen!' });
      fetchTemplates();
      setFile(null);
    }
  };

  const sendNewsletter = async () => {
    if (!subject || !html) {
      setMessage({ type: 'error', text: 'Molimo unesite naslov i HTML sadržaj.' });
      return;
    }
    setLoading(true);
    try {
      // Ovdje ćemo dohvatiti odabrani predložak kako bismo dobili njegov image_url
      // Za sada pretpostavljamo da je html sadržaj već učitan u state
      // Zamjena varijabli
      const processedHtml = html
        .replace('{{IMAGE_URL}}', templates.find(t => t.name === subject)?.image_url || '')
        .replace('{{DISCOUNT_CODE}}', 'TEST-CODE-123'); // Ovdje bi išao pravi kod

      const response = await fetch('/api/send-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, html: processedHtml }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Greška pri slanju');
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

      {message && (
        <div className={`p-4 mb-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Forma za slanje */}
      <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
        <h2 className="text-xl font-semibold mb-4">Slanje</h2>
        <input className="w-full border p-2 mb-2 rounded" placeholder="Naslov" value={subject} onChange={e => setSubject(e.target.value)} />
        <textarea className="w-full border p-2 mb-2 rounded h-32" placeholder="HTML" value={html} onChange={e => setHtml(e.target.value)} />
        <button onClick={sendNewsletter} disabled={loading} className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50 hover:bg-indigo-700 transition-colors cursor-pointer">
          {loading ? 'Slanje...' : 'Pošalji'}
        </button>
        <button onClick={() => setPreview(!preview)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors cursor-pointer ml-2">
          {preview ? 'Zatvori pretpregled' : 'Pretpregled'}
        </button>
        {preview && (
          <div className="mt-4 p-4 border rounded bg-white relative inline-block">
            <img src={html} alt="Preview" className="max-w-full h-auto" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-bold text-2xl bg-black/50 p-2 rounded">Kupon: TEST-CODE-123</span>
            </div>
          </div>
        )}
      </div>

      {/* Forma za spremanje predloška */}
      <form onSubmit={saveTemplate} className="bg-white p-6 rounded-xl shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Spremi novi predložak</h2>
        <input name="name" className="w-full border p-2 mb-2 rounded" placeholder="Ime predloška" required />
        <textarea name="html_content" className="w-full border p-2 mb-2 rounded h-32" placeholder="HTML sadržaj predloška" required />
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full border p-2 mb-2 rounded" />
        <input name="image_url" className="w-full border p-2 mb-2 rounded" placeholder="URL slike predloška (ako ne uploadate)" />
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
              <div className="flex items-center gap-4">
                {t.image_url && <img src={t.image_url} alt={t.name} className="w-16 h-16 object-cover rounded" />}
                <span>{t.name} ({t.start_date} - {t.end_date})</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => loadTemplate(t)} className="text-indigo-600 cursor-pointer hover:underline">Učitaj</button>
                <button onClick={() => deleteTemplate(t.id)} className="text-red-600 cursor-pointer hover:underline">Obriši</button>
              </div>
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
