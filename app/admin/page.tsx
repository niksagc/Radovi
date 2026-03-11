import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import UnreadBadge from '@/components/UnreadBadge';
import DeleteOrderButton from '@/components/DeleteOrderButton';
import AnalyticsChart from '@/components/admin/AnalyticsChart';
import { format, subMonths, startOfMonth as getStartOfMonth, endOfMonth as getEndOfMonth } from 'date-fns';
import { hr } from 'date-fns/locale';

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  // 1. Fetch recent orders
  const { data: orders } = await supabase
    .from('orders')
    .select('*, profiles(first_name, last_name, email), order_messages(created_at, sender_id)')
    .eq('deleted_by_admin', false)
    .order('created_at', { ascending: false })
    .limit(10);

  // 2. Fetch Active Orders Count
  const { count: activeOrdersCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('deleted_by_admin', false)
    .not('status', 'in', '("Završeno","Otkazano","Isteklo")');

  // 3. Fetch Revenue (This Month)
  const now = new Date();
  const startOfThisMonth = getStartOfMonth(now);

  const { data: monthlyPayments } = await supabase
    .from('payments')
    .select('amount_cents')
    .or('status.eq.succeeded,confirmed_by_admin.eq.true')
    .gte('created_at', startOfThisMonth.toISOString());

  const monthlyRevenue = (monthlyPayments?.reduce((sum: number, p: any) => sum + p.amount_cents, 0) || 0) / 100;

  // 4. Fetch "New Messages" count
  const { data: allActiveOrders } = await supabase
    .from('orders')
    .select('id, order_messages(created_at, sender_id)')
    .eq('deleted_by_admin', false)
    .not('status', 'in', '("Završeno","Otkazano","Isteklo")');

  const newMessagesCount = allActiveOrders?.filter((order: any) => {
    const messages = order.order_messages || [];
    if (messages.length === 0) return false;
    const latestMessage = messages.sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
    return latestMessage.sender_id !== user?.id;
  }).length || 0;

  // 5. Fetch Chart Data (Last 6 Months)
  const chartData = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const start = getStartOfMonth(monthDate);
    const end = getEndOfMonth(monthDate);

    const { data: monthPayments } = await supabase
      .from('payments')
      .select('amount_cents')
      .or('status.eq.succeeded,confirmed_by_admin.eq.true')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    const revenue = (monthPayments?.reduce((sum, p) => sum + p.amount_cents, 0) || 0) / 100;
    
    chartData.push({
      name: format(monthDate, 'MMM', { locale: hr }),
      revenue: revenue,
      orders: 0 // We could also count orders if needed
    });
  }

  // 6. Fetch Total Users Count
  const { count: totalUsersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student');

  // 7. Fetch New Inquiries Count
  const { count: newInquiriesCount } = await supabase
    .from('preorder_contacts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'new');

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Nadzorna ploča</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
          <h3 className="text-sm font-medium text-zinc-500">Aktivne narudžbe</h3>
          <p className="mt-2 text-3xl font-bold text-zinc-900">
            {activeOrdersCount || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
          <h3 className="text-sm font-medium text-zinc-500">Nove poruke</h3>
          <p className="mt-2 text-3xl font-bold text-zinc-900">{newMessagesCount}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
          <h3 className="text-sm font-medium text-zinc-500">Novi upiti</h3>
          <p className="mt-2 text-3xl font-bold text-zinc-900">{newInquiriesCount || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
          <h3 className="text-sm font-medium text-zinc-500">Prihod (ovaj mjesec)</h3>
          <p className="mt-2 text-3xl font-bold text-zinc-900">{monthlyRevenue.toFixed(2)} €</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
          <h3 className="text-sm font-medium text-zinc-500">Ukupno korisnika</h3>
          <p className="mt-2 text-3xl font-bold text-zinc-900">{totalUsersCount || 0}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 mb-8">
        <h2 className="text-xl font-bold text-zinc-900 mb-6">Pregled prihoda</h2>
        <AnalyticsChart data={chartData} />
      </div>

      <h2 className="text-xl font-bold text-zinc-900 mb-4">Nedavne narudžbe</h2>
      
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
                
                <div className="flex justify-between items-center text-sm text-zinc-600 mb-4">
                  <span className="font-bold text-zinc-900">{(order.total_cents / 100).toFixed(2)} €</span>
                  <div className="flex items-center space-x-2">
                    <Link 
                      href={`/admin/narudzbe/${order.id}`}
                      className="text-indigo-600 font-medium hover:text-indigo-800"
                    >
                      Upravljaj &rarr;
                    </Link>
                    <DeleteOrderButton orderId={order.id} userRole="admin" status={order.status} />
                  </div>
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
