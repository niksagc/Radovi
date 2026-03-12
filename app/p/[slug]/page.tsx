import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import UserHeader from '@/app/dashboard/UserHeader';
import { logout } from '@/app/login/actions';

export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const supabase = await createClient();
  const resolvedParams = await params;
  
  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', resolvedParams.slug)
    .eq('is_published', true)
    .single();

  let staticPage = null;
  if (!page) {
    if (resolvedParams.slug === 'o-nama') {
      staticPage = {
        title: 'O nama',
        content: 'StudyWorks je platforma gdje studenti mogu naručiti pomoć pri uređivanju, formatiranju i pripremi školskih dokumenata kao što su eseji, seminarski radovi, završni radovi i PowerPoint prezentacije. Naš tim stručnjaka stoji vam na raspolaganju kako bi vaše radove učinio kvalitetnijima i profesionalnijima.'
      };
    } else if (resolvedParams.slug === 'uvjeti-poslovanja') {
      staticPage = {
        title: 'Uvjeti poslovanja',
        content: 'Ovdje se nalaze uvjeti poslovanja. Korištenjem naše platforme prihvaćate naše uvjete. Narudžbe se mogu otkazati unutar 14 dana. Depozit je nepovratan.'
      };
    } else {
      notFound();
    }
  }

  const pageToDisplay = page || staticPage;
  
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {user ? (
        <div className="sticky top-0 z-50 w-full">
          <UserHeader logoutAction={logout} />
        </div>
      ) : (
        <header className="bg-white border-b border-zinc-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-indigo-600 tracking-tight">
                StudyWorks
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/kategorije" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
                Katalog
              </Link>
              <Link href="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
                Prijava
              </Link>
            </div>
          </div>
        </header>
      )}

      <main className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <article className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-zinc-200">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 mb-8">
            {pageToDisplay.title}
          </h1>
          
          <div className="prose prose-zinc prose-indigo max-w-none">
            <ReactMarkdown>{pageToDisplay.content}</ReactMarkdown>
          </div>
        </article>
      </main>

      <footer className="bg-white border-t border-zinc-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-zinc-500 text-sm">
            &copy; {new Date().getFullYear()} StudyWorks. Sva prava pridržana.
          </p>
        </div>
      </footer>
    </div>
  );
}
