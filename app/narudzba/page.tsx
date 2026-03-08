import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import OrderForm from './OrderForm';
import UserHeader from '../dashboard/UserHeader';
import { logout } from '@/app/login/actions';

export default async function CheckoutPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login?redirect=/narudzba');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <div className="sticky top-0 z-50 w-full">
        <UserHeader logoutAction={logout} />
      </div>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 relative z-0">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 mb-8">
          Detalji narudžbe
        </h1>
        
        <OrderForm profile={profile} />
      </main>
    </div>
  );
}
