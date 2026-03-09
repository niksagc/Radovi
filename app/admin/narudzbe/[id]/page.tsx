import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import OrderActions from './OrderActions';
import OrderChat from '@/components/OrderChat';

export default async function AdminOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const resolvedParams = await params;
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }
  
  const { data: order } = await supabase
    .from('orders')
    .select('*, profiles(first_name, last_name, email, phone), order_items(*), order_addons(*), files(*), payments(*)')
    .eq('id', resolvedParams.id)
    .single();

  if (!order) {
    notFound();
  }

  if (order.deleted_by_admin) {
    redirect('/admin/narudzbe');
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/narudzbe" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center">
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
            <h2 className="text-xl font-bold text-zinc-900 mb-4">Podaci o kupcu</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-zinc-500 block">Ime i prezime</span>
                <span className="font-medium text-zinc-900">{order.profiles?.first_name} {order.profiles?.last_name}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Email</span>
                <span className="font-medium text-zinc-900">{order.profiles?.email}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Telefon</span>
                <span className="font-medium text-zinc-900">{order.profiles?.phone || 'Nije navedeno'}</span>
              </div>
            </div>
          </div>

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
            
            {order.instructions && (
              <div className="mt-6 pt-6 border-t border-zinc-100">
                <span className="text-zinc-500 block mb-2">Upute za urednika</span>
                <p className="text-sm text-zinc-900 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                  {order.instructions}
                </p>
              </div>
            )}
          </div>

          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-zinc-200">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">Datoteke</h2>
            
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-zinc-700">Klijentove datoteke</h3>
              {(order.files?.filter((f: any) => f.kind === 'client_upload' || f.kind === 'school_instructions') || []).length > 0 ? (
                <ul className="divide-y divide-zinc-100 border border-zinc-200 rounded-xl overflow-hidden">
                  {(order.files?.filter((f: any) => f.kind === 'client_upload' || f.kind === 'school_instructions') || []).map((file: any) => (
                    <li key={file.id} className="p-3 flex items-center justify-between bg-zinc-50">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-zinc-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <span className="text-sm text-zinc-900">{file.filename}</span>
                      </div>
                      <a href={`/api/files/download?id=${file.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                        Preuzmi
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500">Nema učitanih datoteka.</p>
              )}
            </div>
          </div>
          
          {/* Chat Section */}
          <OrderChat orderId={order.id} currentUserId={user.id} currentUserRole="admin" />
        </div>

        <div className="space-y-8">
          <OrderActions order={order} />
        </div>
      </div>
    </div>
  );
}
