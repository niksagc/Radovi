'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { updateOrderStatus } from '@/lib/actions/orders';

export default function OrderActions({ order }: { order: any }) {
  const [status, setStatus] = useState(order.status);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);
    try {
      await updateOrderStatus(order.id, newStatus);
      setStatus(newStatus);
      router.refresh();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Greška pri ažuriranju statusa.');
    }
    setLoading(false);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const fileExt = file.name.split('.').pop();
      const fileName = `deliverable_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${order.id}/deliverables/${fileName}`;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('filePath', filePath);
      formData.append('bucket', 'orders');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        let errorMessage = 'Greška pri prijenosu datoteke';
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          if (res.status === 413) {
            errorMessage = 'Datoteka je prevelika. Maksimalna veličina je 10MB.';
          } else {
            errorMessage = `Greška na poslužitelju (${res.status})`;
          }
        }
        throw new Error(errorMessage);
      }

      const { error: dbError } = await supabase.from('files').insert({
        order_id: order.id,
        uploader_id: user?.id,
        kind: 'deliverable',
        path: filePath,
        filename: file.name,
        size_bytes: file.size,
        is_locked: order.payment_model === '50-50' && order.status !== 'Završeno',
      });

      if (dbError) throw dbError;

      // Update order status based on payment model
      const nextStatus = order.payment_model === '50-50' ? 'Čeka uplatu 2.dijela' : 'Isporučeno';
      await handleStatusChange(nextStatus);
      
      setFile(null);
      router.refresh();
    } catch (err) {
      console.error('Upload error:', err);
      alert('Greška pri učitavanju datoteke.');
    }
    setUploading(false);
  };

  const confirmIbanPayment = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ status: 'succeeded', confirmed_by_admin: true })
        .eq('id', paymentId);

      if (error) throw error;
      
      // Find the payment to know which stage it was
      const payment = order.payments.find((p: any) => p.id === paymentId);
      
      if (payment) {
        let newStatus = order.status;
        if (payment.stage === 'deposit') {
          newStatus = 'Uplaćen depozit - U izradi';
        } else if (payment.stage === 'full') {
          newStatus = 'U izradi';
        } else if (payment.stage === 'final') {
          newStatus = 'Završeno';
          // Unlock files
          await supabase.from('files').update({ is_locked: false }).eq('order_id', order.id);
        }

        await handleStatusChange(newStatus);
      }
      
      router.refresh();
    } catch (err) {
      console.error('Error confirming payment:', err);
      alert('Greška pri potvrdi plaćanja.');
    }
  };

  const pendingIbanPayments = order.payments?.filter((p: any) => p.method === 'iban' && p.status === 'pending');

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
        <h2 className="text-xl font-bold text-zinc-900 mb-4">Akcije</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Promijeni status</label>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={loading}
              className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="Nacrt">Nacrt</option>
              <option value="Čeka uplatu">Čeka uplatu</option>
              <option value="Uplaćen depozit - U izradi">Uplaćen depozit - U izradi</option>
              <option value="U izradi">U izradi</option>
              <option value="Isporučeno">Isporučeno</option>
              <option value="Čeka uplatu 2.dijela">Čeka uplatu 2.dijela</option>
              <option value="Završeno">Završeno</option>
              <option value="Otkazano zbog neplaćanja (2. dio)">Otkazano zbog neplaćanja (2. dio)</option>
              <option value="Otkazano">Otkazano</option>
              <option value="Isteklo">Isteklo</option>
            </select>
          </div>
        </div>
      </div>

      {pendingIbanPayments && pendingIbanPayments.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 border-l-4 border-l-yellow-400">
          <h2 className="text-xl font-bold text-zinc-900 mb-4">Potvrda IBAN uplate</h2>
          
          {pendingIbanPayments.map((payment: any) => (
            <div key={payment.id} className="mb-4 p-4 bg-zinc-50 rounded-xl border border-zinc-200">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-zinc-700">Iznos:</span>
                <span className="text-sm font-bold text-zinc-900">{(payment.amount_cents / 100).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between mb-4">
                <span className="text-sm font-medium text-zinc-700">Faza:</span>
                <span className="text-sm text-zinc-900">{payment.stage === 'deposit' ? 'Depozit (50%)' : payment.stage === 'full' ? 'Cijeli iznos (100%)' : 'Ostatak (50%)'}</span>
              </div>
              
              {payment.iban_proof_url && (
                <a 
                  href={`/api/files/download?path=${encodeURIComponent(payment.iban_proof_url)}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block w-full text-center py-2 mb-3 bg-white border border-zinc-300 text-zinc-700 font-medium rounded-xl hover:bg-zinc-50 transition-colors text-sm"
                >
                  Pogledaj potvrdu
                </a>
              )}
              
              <button
                onClick={() => confirmIbanPayment(payment.id)}
                className="w-full py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors text-sm"
              >
                Potvrdi uplatu
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
        <h2 className="text-xl font-bold text-zinc-900 mb-4">Isporuka rada</h2>
        
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Učitaj gotov rad (PDF, DOCX, PPTX)
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>
          
          <button
            type="submit"
            disabled={uploading || !file}
            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm text-sm disabled:opacity-70"
          >
            {uploading ? 'Učitavanje...' : 'Isporuči rad'}
          </button>
        </form>
        
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-zinc-700 mb-3">Isporučene datoteke</h3>
          {(order.files?.filter((f: any) => f.kind === 'deliverable') || []).length > 0 ? (
            <ul className="divide-y divide-zinc-100 border border-zinc-200 rounded-xl overflow-hidden">
              {(order.files?.filter((f: any) => f.kind === 'deliverable') || []).map((file: any) => (
                <li key={file.id} className="p-3 flex items-center justify-between bg-white">
                  <span className="text-sm font-medium text-zinc-900 truncate mr-2">{file.filename}</span>
                  {file.is_locked ? (
                    <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full whitespace-nowrap">
                      Zaključano
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full whitespace-nowrap">
                      Otključano
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">Nema isporučenih datoteka.</p>
          )}
        </div>
      </div>
    </div>
  );
}
