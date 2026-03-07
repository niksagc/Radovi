import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const resolvedParams = await params;
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*), order_addons(*), files(*), payments(*)')
    .eq('id', resolvedParams.id)
    .single();

  if (!order) {
    notFound();
  }

  if (order.student_id !== user.id) {
    redirect('/dashboard');
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Natrag na narudžbe
        </Link>
      </div>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Narudžba #{order.id.substring(0, 8)}</h1>
        <span className="px-3 py-1 text-sm font-semibold rounded-full bg-indigo-100 text-indigo-800">
          {order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-zinc-200">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">Detalji rada</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-zinc-500 block">Tema</span>
                <span className="font-medium text-zinc-900">{order.topic}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Predmet</span>
                <span className="font-medium text-zinc-900">{order.subject}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Rok isporuke</span>
                <span className="font-medium text-zinc-900">
                  {order.deadline ? new Date(order.deadline).toLocaleDateString('hr-HR') : 'Nije navedeno'}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block">Datum narudžbe</span>
                <span className="font-medium text-zinc-900">
                  {new Date(order.created_at).toLocaleDateString('hr-HR')}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-zinc-200">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">Datoteke</h2>
            
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-zinc-700">Vaše datoteke</h3>
              {(order.files?.filter((f: any) => f.kind === 'client_upload' || f.kind === 'school_instructions') || []).length > 0 ? (
                <ul className="divide-y divide-zinc-100 border border-zinc-200 rounded-xl overflow-hidden">
                  {(order.files?.filter((f: any) => f.kind === 'client_upload' || f.kind === 'school_instructions') || []).map((file: any) => (
                    <li key={file.id} className="p-3 flex items-center justify-between bg-zinc-50">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-zinc-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <span className="text-sm text-zinc-900">{file.filename}</span>
                      </div>
                      <span className="text-xs text-zinc-500">{(file.size_bytes / 1024).toFixed(1)} KB</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500">Nema učitanih datoteka.</p>
              )}

              <h3 className="text-sm font-semibold text-zinc-700 mt-6 pt-4 border-t border-zinc-100">Isporučeni radovi</h3>
              {(order.files?.filter((f: any) => f.kind === 'deliverable') || []).length > 0 ? (
                <ul className="divide-y divide-zinc-100 border border-zinc-200 rounded-xl overflow-hidden">
                  {(order.files?.filter((f: any) => f.kind === 'deliverable') || []).map((file: any) => (
                    <li key={file.id} className="p-3 flex items-center justify-between bg-white">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-indigo-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <span className="text-sm font-medium text-zinc-900">{file.filename}</span>
                      </div>
                      {file.is_locked ? (
                        <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                          Zaključano (čeka uplatu)
                        </span>
                      ) : (
                        <a href={`/api/files/download?id=${file.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                          Preuzmi
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500">Rad još nije isporučen.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-zinc-200">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">Plaćanje</h2>
            
            <div className="space-y-3 mb-6 text-sm">
              <div className="flex justify-between text-zinc-600">
                <span>Osnovne usluge</span>
                <span>{(order.subtotal_cents / 100).toFixed(2)} €</span>
              </div>
              {order.addons_total_cents > 0 && (
                <div className="flex justify-between text-zinc-600">
                  <span>Dodaci</span>
                  <span>{(order.addons_total_cents / 100).toFixed(2)} €</span>
                </div>
              )}
              <div className="border-t border-zinc-200 pt-3 flex justify-between font-bold text-zinc-900">
                <span>Ukupno</span>
                <span>{(order.total_cents / 100).toFixed(2)} €</span>
              </div>
              
              {order.payment_model === '50-50' && (
                <div className="mt-4 p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                  <p className="font-semibold text-zinc-900 mb-2">Model 50/50</p>
                  <div className="flex justify-between text-zinc-600 mb-1">
                    <span>Depozit (50%)</span>
                    <span>{(order.deposit_cents / 100).toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>Ostatak (50%)</span>
                    <span>{(order.final_cents / 100).toFixed(2)} €</span>
                  </div>
                </div>
              )}
            </div>

            {order.status === 'Nacrt' || order.status === 'Čeka uplatu' ? (
              <Link href={`/placanje/${order.id}`} className="block w-full text-center py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
                Plati sada
              </Link>
            ) : order.status === 'Čeka potvrdu naplate (2. dio)' ? (
              <Link href={`/placanje/${order.id}`} className="block w-full text-center py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
                Plati 2. dio
              </Link>
            ) : (
              <div className="text-center p-3 bg-green-50 text-green-700 rounded-xl font-medium border border-green-200">
                Plaćanje uređeno
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
