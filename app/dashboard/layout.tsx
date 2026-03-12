import { logout } from '@/app/login/actions';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <div className="sticky top-0 z-50 w-full">
        <Header logoutAction={logout} role={role} />
      </div>
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 relative z-0">
        {children}
      </main>
      <Footer />
    </div>
  );
}
