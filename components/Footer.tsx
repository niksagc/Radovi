import Link from 'next/link';
import Logo from './Logo';
import { createClient } from '@/lib/supabase/server';
import { Facebook, Instagram } from 'lucide-react';
import NewsletterForm from './NewsletterForm';

export default async function Footer() {
  const supabase = await createClient();
  
  const { data: footer } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', 'footer-content')
    .eq('is_published', true)
    .single();

  const { data: settings } = await supabase
    .from('app_settings')
    .select('facebook_url, instagram_url')
    .single();

  const { data: footerPages } = await supabase
    .from('pages')
    .select('title, slug')
    .eq('is_published', true)
    .eq('show_in_footer', true);

  const footerText = footer?.content || `© ${new Date().getFullYear()} StudyWorks. Sva prava pridržana.`;

  return (
    <footer className="bg-white border-t border-zinc-200 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <Link href="/">
              <Logo variant="full" className="opacity-80 grayscale hover:grayscale-0 transition-all" />
            </Link>
            <div className="text-zinc-500 text-sm">
              {footerText}
            </div>
          </div>
          <div className="flex flex-col items-center md:items-end gap-6">
            <NewsletterForm />
            <div className="flex flex-wrap justify-center gap-6">
              <Link href="/p/o-nama" className="text-sm text-zinc-500 hover:text-indigo-600 transition-colors">O nama</Link>
              <Link href="/p/uvjeti-poslovanja" className="text-sm text-zinc-500 hover:text-indigo-600 transition-colors">Uvjeti poslovanja</Link>
              {footerPages?.map(page => (
                <Link key={page.slug} href={`/p/${page.slug}`} className="text-sm text-zinc-500 hover:text-indigo-600 transition-colors">{page.title}</Link>
              ))}
              <Link href="/p/blog" className="text-sm text-zinc-500 hover:text-indigo-600 transition-colors">Blog</Link>
              <Link href="/kontakt" className="text-sm text-zinc-500 hover:text-indigo-600 transition-colors">Kontakt</Link>
            </div>
            <div className="flex gap-4">
              {settings?.facebook_url && (
                <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-indigo-600 transition-colors">
                  <Facebook size={20} />
                </a>
              )}
              {settings?.instagram_url && (
                <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-indigo-600 transition-colors">
                  <Instagram size={20} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
