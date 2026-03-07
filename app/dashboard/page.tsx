import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import UnreadBadge from '@/components/UnreadBadge';

export default async function DashboardPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_messages(created_at, sender_id)')
    .eq('student_id', user?.id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Moje narudžbe</h1>
        <Link href="/kategorije" className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium">
          Nova narudžba
        </Link>
      </div>
      
      {orders && orders.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
            <table className="min-w-full divide-y divide-zinc-200">
              <thead className="bg-zinc-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    ID Narudžbe
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Datum
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Iznos
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Detalji</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-zinc-200">
                {orders.map((order: any) => {
                  const messages = order.order_messages || [];
                  const latestMessage = messages.length > 0 
                    ? messages.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] 
                    : null;
                    
                  return (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">
                      {order.id.substring(0, 8)}...
                      {user && (
                        <UnreadBadge 
                          orderId={order.id} 
                          latestMessageAt={latestMessage?.created_at} 
                          latestMessageSenderId={latestMessage?.sender_id} 
                          currentUserId={user.id} 
                        />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                      {new Date(order.created_at).toLocaleDateString('hr-HR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-zinc-100 text-zinc-800">
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                      {(order.total_cents / 100).toFixed(2)} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/dashboard/narudzbe/${order.id}`} className="text-indigo-600 hover:text-indigo-900">
                        Detalji
                      </Link>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {orders.map((order: any) => {
              const messages = order.order_messages || [];
              const latestMessage = messages.length > 0 
                ? messages.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] 
                : null;
                
              return (
              <div key={order.id} className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center">
                    <span className="text-xs font-mono text-zinc-500">#{order.id.substring(0, 8)}</span>
                    {user && (
                      <UnreadBadge 
                        orderId={order.id} 
                        latestMessageAt={latestMessage?.created_at} 
                        latestMessageSenderId={latestMessage?.sender_id} 
                        currentUserId={user.id} 
                      />
                    )}
                  </div>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-zinc-100 text-zinc-800">
                    {order.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm text-zinc-600 mb-4">
                  <div>
                    <span className="block text-xs text-zinc-400">Datum</span>
                    {new Date(order.created_at).toLocaleDateString('hr-HR')}
                  </div>
                  <div className="text-right">
                    <span className="block text-xs text-zinc-400">Iznos</span>
                    <span className="font-bold text-zinc-900">{(order.total_cents / 100).toFixed(2)} €</span>
                  </div>
                </div>

                <Link 
                  href={`/dashboard/narudzbe/${order.id}`}
                  className="block w-full text-center py-2 bg-indigo-50 text-indigo-700 font-medium rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  Detalji narudžbe
                </Link>
              </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-zinc-200">
          <svg className="mx-auto h-12 w-12 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-zinc-900">Nema narudžbi</h3>
          <p className="mt-1 text-sm text-zinc-500">Još niste napravili nijednu narudžbu.</p>
          <div className="mt-6">
            <Link href="/kategorije" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Pregledaj usluge
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
