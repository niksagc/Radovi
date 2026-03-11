'use client';

import { useState } from 'react';
import { Mail, Calendar, User, FileText, CheckCircle, X, Send, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function UpitItem({ upit }: { upit: any }) {
  const [loading, setLoading] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const markAsReplied = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('preorder_contacts')
        .update({ status: 'replied' })
        .eq('id', upit.id);

      if (error) throw error;
      router.refresh();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Greška pri ažuriranju statusa.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      // First delete associated files from storage if any
      if (upit.files && upit.files.length > 0) {
        const filePaths = upit.files.map((f: any) => f.path);
        await supabase.storage.from('preorders').remove(filePaths);
      }

      // Delete the record (cascade will handle file records in DB)
      const { error } = await supabase
        .from('preorder_contacts')
        .delete()
        .eq('id', upit.id);

      if (error) throw error;
      
      setShowDeleteConfirm(false);
      router.refresh();
    } catch (error) {
      console.error('Error deleting inquiry:', error);
      alert('Greška pri brisanju upita.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setSendingReply(true);
    try {
      const res = await fetch('/api/admin/reply-to-inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inquiryId: upit.id,
          email: upit.email,
          subject: `Odgovor na vaš upit: ${upit.subject || 'Upit'}`,
          message: replyMessage,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setShowReplyModal(false);
        setReplyMessage('');
        router.refresh();
        alert('Odgovor je uspješno poslan!');
      } else {
        alert(data.error || 'Došlo je do greške pri slanju odgovora.');
      }
    } catch (err) {
      alert('Greška u komunikaciji sa serverom.');
    } finally {
      setSendingReply(false);
    }
  };

  const encodedSubject = encodeURIComponent(`Ponuda za: ${upit.subject || 'Upit'}`);

  return (
    <>
      <div className={`bg-zinc-900 border ${upit.status === 'replied' ? 'border-emerald-500/30' : 'border-zinc-800'} rounded-xl overflow-hidden transition-all`}>
        <div className="p-6">
          <div className="flex flex-wrap justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full ${upit.status === 'replied' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'} flex items-center justify-center`}>
                {upit.status === 'replied' ? <CheckCircle size={24} /> : <User size={24} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-white">{upit.name}</h3>
                  {upit.status === 'replied' && (
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] uppercase font-bold rounded-full border border-emerald-500/20">
                      Obrađeno
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                  <Mail size={14} />
                  <span className="text-zinc-400">
                    {upit.email}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Primljeno</span>
              <span className="text-zinc-300">{new Date(upit.created_at).toLocaleDateString('hr-HR')}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="mb-4">
                <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Predmet</span>
                <p className="text-white font-medium">{upit.subject || 'Bez naslova'}</p>
              </div>
              <div className="mb-4">
                <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Rok</span>
                <div className="flex items-center gap-2 text-zinc-300">
                  <Calendar size={16} className="text-indigo-400" />
                  {upit.deadline ? new Date(upit.deadline).toLocaleDateString('hr-HR') : 'Nije navedeno'}
                </div>
              </div>
            </div>
            <div>
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Poruka</span>
              <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 text-zinc-300 text-sm whitespace-pre-wrap">
                {upit.message}
              </div>
            </div>
          </div>

          {upit.files && upit.files.length > 0 && (
            <div className="mt-6 pt-6 border-t border-zinc-800">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold block mb-3">Priložene datoteke</span>
              <div className="flex flex-wrap gap-3">
                {upit.files.map((file: any) => (
                  <div key={file.id} className="flex items-center gap-3 bg-zinc-800/50 p-3 rounded-lg border border-zinc-700">
                    <FileText size={20} className="text-indigo-400" />
                    <div className="flex flex-col">
                      <span className="text-sm text-white font-medium truncate max-w-[200px]">{file.filename}</span>
                      <span className="text-xs text-zinc-500">{(file.size_bytes / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="bg-zinc-950/50 px-6 py-4 border-t border-zinc-800 flex justify-between items-center">
          <div>
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
              title="Obriši upit"
            >
              <Trash2 size={20} />
            </button>
          </div>
          <div className="flex gap-3">
            {upit.status !== 'replied' && (
              <button 
                onClick={markAsReplied}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
              >
                {loading ? 'Obrađivanje...' : 'Označi kao obrađeno'}
              </button>
            )}
            <button 
              onClick={() => setShowReplyModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Mail size={16} />
              Odgovori na upit
            </button>
          </div>
        </div>
      </div>

      {/* Reply Modal */}
      {showReplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Slanje odgovora</h3>
              <button 
                onClick={() => setShowReplyModal(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSendReply}>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Za:</label>
                    <div className="text-white font-medium">{upit.name}</div>
                    <div className="text-zinc-500 text-sm">{upit.email}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Predmet:</label>
                    <div className="text-white font-medium truncate">Odgovor na vaš upit: {upit.subject || 'Upit'}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Vaša poruka:</label>
                  <textarea
                    required
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={8}
                    placeholder="Napišite vaš odgovor ovdje..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none resize-none"
                  ></textarea>
                </div>
              </div>
              <div className="p-6 bg-zinc-950/50 border-t border-zinc-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowReplyModal(false)}
                  className="px-6 py-2 text-zinc-400 hover:text-white font-medium transition-colors"
                >
                  Odustani
                </button>
                <button
                  type="submit"
                  disabled={sendingReply || !replyMessage.trim()}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingReply ? (
                    <>Slanje...</>
                  ) : (
                    <>
                      <Send size={18} />
                      Pošalji odgovor
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Obriši upit?</h3>
              <p className="text-zinc-400 mb-6">
                Jeste li sigurni da želite obrisati ovaj upit? Ova radnja je trajna i ne može se poništiti.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl transition-all"
                >
                  Odustani
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
                >
                  {loading ? 'Brisanje...' : 'Obriši'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
