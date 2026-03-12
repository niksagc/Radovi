import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import PaymentOptions from './PaymentOptions';
import Link from 'next/link';
import Header from '@/components/Header';
import { logout } from '@/app/login/actions';

export default async function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const resolvedParams = await params;
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  let role = 'student';
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile) {
      role = profile.role;
    }
  }

  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*), order_addons(*)')
    .eq('id', resolvedParams.id)
    .single();

  if (!order) {
    notFound();
  }

  // Check if order belongs to user
  if (order.student_id !== user.id) {
    redirect('/dashboard');
  }

  // If already paid deposit or full, redirect to order details
  if (['Depozit plaćen', 'Uplaćen depozit - U izradi', 'U izradi', 'Isporučeno', 'Završeno'].includes(order.status)) {
    redirect(`/dashboard/narudzbe/${order.id}`);
  }

  const { data: appSettings } = await supabase
    .from('app_settings')
    .select('*')
    .single();

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <div className="sticky top-0 z-50 w-full">
        <Header logoutAction={logout} role={role} />
      </div>

      <main className="flex-grow max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 relative z-0">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 mb-8 text-center">
          Plaćanje
        </h1>
        
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200 mb-8">
          <h2 className="text-xl font-bold text-zinc-900 mb-4">Sažetak narudžbe #{order.id.substring(0, 8)}</h2>
          
          <div className="space-y-4 mb-6">
            {order.order_items?.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-zinc-600">{item.name} (x{item.quantity})</span>
                <span className="font-medium text-zinc-900">{((item.price_cents * item.quantity) / 100).toFixed(2)} €</span>
              </div>
            ))}
            {order.order_addons?.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-zinc-600">{item.name} (x{item.quantity})</span>
                <span className="font-medium text-zinc-900">{((item.price_cents * item.quantity) / 100).toFixed(2)} €</span>
              </div>
            ))}
            
            <div className="border-t border-zinc-200 pt-4 mt-4">
              <div className="flex justify-between text-base font-bold">
                <span className="text-zinc-900">Ukupno za platiti sada</span>
                <span className="text-indigo-600">
                  {order.payment_model === '50-50' 
                    ? (order.deposit_cents / 100).toFixed(2) 
                    : (order.total_cents / 100).toFixed(2)} €
                </span>
              </div>
              {order.payment_model === '50-50' && (
                <p className="text-xs text-zinc-500 mt-1 text-right">
                  (Preostalih {(order.final_cents / 100).toFixed(2)} € plaćate po preuzimanju)
                </p>
              )}
            </div>
          </div>
        </div>

        <PaymentOptions order={order} appSettings={appSettings} />
      </main>
    </div>
  );
}
