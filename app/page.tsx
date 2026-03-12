import Link from 'next/link';
import Footer from '@/components/Footer';
import Logo from '@/components/Logo';
import Header from '@/components/Header';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/app/login/actions';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let role = undefined;
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

  const { data: hero } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', 'home-hero')
    .eq('is_published', true)
    .single();

  const title = hero?.title || 'Profesionalna pomoć za vaše akademske radove';
  const description = hero?.content || 'Nudimo usluge lekture, formatiranja i pripreme eseja, seminarskih i završnih radova te prezentacija. Vaš trud zaslužuje savršenu prezentaciju.';

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Header logoutAction={logout} role={role} />

      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-900 mb-6">
            {title.split('akademske radove')[0]}<span className="text-indigo-600">akademske radove</span>{title.split('akademske radove')[1]}
          </h1>
          <p className="text-xl text-zinc-600 mb-10 max-w-2xl mx-auto">
            {description}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/kategorije" className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white font-semibold rounded-2xl hover:bg-indigo-700 transition-colors shadow-sm text-lg">
              Pregledaj usluge
            </Link>
            <Link href="/kontakt" className="w-full sm:w-auto px-8 py-4 bg-white text-zinc-700 font-semibold rounded-2xl border border-zinc-200 hover:bg-zinc-50 transition-colors shadow-sm text-lg">
              Zatraži ponudu
            </Link>
          </div>
          
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4 text-xl font-bold">1</div>
              <h3 className="text-lg font-bold text-zinc-900 mb-2">Odaberite uslugu</h3>
              <p className="text-zinc-600">Pronađite uslugu koja vam je potrebna, od lekture do potpunog formatiranja rada.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4 text-xl font-bold">2</div>
              <h3 className="text-lg font-bold text-zinc-900 mb-2">Pošaljite materijale</h3>
              <p className="text-zinc-600">Učitajte svoj nacrt i upute mentora. Mi ćemo se pobrinuti za ostalo.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4 text-xl font-bold">3</div>
              <h3 className="text-lg font-bold text-zinc-900 mb-2">Preuzmite rad</h3>
              <p className="text-zinc-600">Nakon završetka, preuzmite savršeno uređen rad spreman za predaju.</p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
