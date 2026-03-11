import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import OrderForm from './OrderForm';
import UserHeader from '../dashboard/UserHeader';
import { logout } from '@/app/login/actions';

export default async function CheckoutPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login?redirect=/narudzba');
  }

  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // If profile is missing (e.g. trigger failed previously), try to create a minimal one
  if (!profile) {
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        username: user.email?.split('@')[0] || `user_${user.id.substring(0, 8)}`,
        role: 'student'
      })
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating missing profile:', createError);
      // If we still can't create it, we might need to show an error
      return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200 max-w-md w-full text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Greška profila</h2>
            <p className="text-zinc-600 mb-6">
              Došlo je do pogreške prilikom učitavanja vašeg profila. Molimo kontaktirajte podršku.
            </p>
            <Link href="/dashboard" className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-xl font-medium">
              Povratak na dashboard
            </Link>
          </div>
        </div>
      );
    }
    profile = newProfile;
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <div className="sticky top-0 z-50 w-full">
        <UserHeader logoutAction={logout} role={profile?.role} />
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
