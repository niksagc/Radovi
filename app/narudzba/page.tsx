import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import OrderForm from './OrderForm';

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
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-indigo-600 tracking-tight">
              StudyWorks
            </span>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 mb-8">
          Detalji narudžbe
        </h1>
        
        <OrderForm profile={profile} />
      </main>
    </div>
  );
}
