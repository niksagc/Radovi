import Link from 'next/link';
import Logo from './Logo';
import { createClient } from '@/lib/supabase/server';

export default async function Footer() {
  const supabase = await createClient();
  
  const { data: footer } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', 'footer-content')
    .eq('is_published', true)
    .single();

  const footerText = footer?.content || `© ${new Date().getFullYear()} StudyWorks. Sva prava pridržana.`;

  return (
    <footer className="bg-white border-t border-zinc-200 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <Link href="/">
              <Logo variant="full" className="opacity-80 grayscale hover:grayscale-0 transition-all" />
            </Link>
            <div className="text-zinc-500 text-sm">
              {footerText}
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <Link href="/p/o-nama" className="text-sm text-zinc-500 hover:text-indigo-600 transition-colors">O nama</Link>
            <Link href="/p/uvjeti-poslovanja" className="text-sm text-zinc-500 hover:text-indigo-600 transition-colors">Uvjeti poslovanja</Link>
            <Link href="/p/blog" className="text-sm text-zinc-500 hover:text-indigo-600 transition-colors">Blog</Link>
            <Link href="/kontakt" className="text-sm text-zinc-500 hover:text-indigo-600 transition-colors">Kontakt</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
