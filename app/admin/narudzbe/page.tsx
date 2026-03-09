import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import UnreadBadge from '@/components/UnreadBadge';
import DeleteOrderButton from '@/components/DeleteOrderButton';

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: orders } = await supabase
    .from('orders')
    .select('*, profiles(first_name, last_name, email), order_messages(created_at, sender_id)')
    .eq('deleted_by_admin', false)
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Upravljanje narudžbama</h1>
      </div>
      
      {orders && orders.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
            <table className="min-w-full divide-y divide-zinc-200">
              <thead className="bg-zinc-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Kupac
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
                      {order.profiles?.first_name} {order.profiles?.last_name}
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
                      <div className="flex items-center justify-end space-x-2">
                        <Link href={`/admin/narudzbe/${order.id}`} className="text-indigo-600 hover:text-indigo-900">
                          Upravljaj
                        </Link>
                        <DeleteOrderButton orderId={order.id} userRole="admin" status={order.status} />
                      </div>
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
                  <div>
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
                    <h3 className="font-bold text-zinc-900">{order.profiles?.first_name} {order.profiles?.last_name}</h3>
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

                <div className="flex items-center space-x-2">
                  <Link 
                    href={`/admin/narudzbe/${order.id}`}
                    className="block flex-1 text-center py-2 bg-indigo-50 text-indigo-700 font-medium rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    Upravljaj narudžbom
                  </Link>
                  <DeleteOrderButton orderId={order.id} userRole="admin" status={order.status} />
                </div>
              </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-zinc-200">
          <p className="text-sm text-zinc-500">Nema narudžbi.</p>
        </div>
      )}
    </div>
  );
}
