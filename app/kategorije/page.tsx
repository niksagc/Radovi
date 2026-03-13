import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Header from '@/components/Header';
import { logout } from '@/app/login/actions';
import Catalog from '@/components/Catalog';

export default async function CategoriesPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
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
  
  const { data: categories } = await supabase
    .from('categories')
    .select('*, items(*)')
    .order('sort_order', { ascending: true });

  const { data: items } = await supabase
    .from('items')
    .select('*, categories(name)')
    .eq('is_active', true);

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {user ? (
        <div className="sticky top-0 z-50 w-full">
          <Header logoutAction={logout} role={role} />
        </div>
      ) : (
        <header className="bg-white border-b border-zinc-200 sticky top-0 z-50">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-indigo-600 tracking-tight">
                StudyWorks
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
                Prijava
              </Link>
              <Link href="/register" className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors">
                Registracija
              </Link>
            </div>
          </div>
        </header>
      )}

      <main className="flex-grow max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 relative z-0">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 mb-8">
          Katalog usluga
        </h1>
        
        <Catalog categories={categories || []} items={items || []} />
      </main>
    </div>
  );
}
