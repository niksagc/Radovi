'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LogOut, ShoppingCart, Package, LayoutGrid, BookOpen, Share2, Settings, Shield, Facebook, Instagram } from 'lucide-react';
import Logo from '@/components/Logo';
import { useCartStore } from '@/lib/store/cart';
import { createClient } from '@/lib/supabase/client';

export default function Header({ logoutAction, role }: { logoutAction?: () => Promise<void>, role?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<any>(null);
  const pathname = usePathname();
  const isLoggedIn = !!role;
  const { clearCart } = useCartStore();
  const supabase = createClient();

  useEffect(() => {
    const fetchAppSettings = async () => {
      const { data, error } = await supabase.from('app_settings').select('*').single();
      if (!error && data) {
        setAppSettings(data);
      }
    };
    fetchAppSettings();
  }, [supabase]);

  const publicNavigation = [
    { name: 'Blog', href: '/p/blog', icon: <BookOpen size={16} /> },
    { name: 'Portfolio', href: '/portfolio', icon: <BookOpen size={16} /> },
    { name: 'O meni', href: '/o-meni', icon: <BookOpen size={16} /> },
    { name: 'Kontakt', href: '/kontakt', icon: <BookOpen size={16} /> },
  ];

  const privateNavigation = [
    { name: 'Moje narudžbe', href: '/dashboard', icon: <Package size={16} /> },
    { name: 'Katalog usluga', href: '/kategorije', icon: <LayoutGrid size={16} /> },
    { name: 'Blog', href: '/p/blog', icon: <BookOpen size={16} /> },
    { name: 'Portfolio', href: '/portfolio', icon: <BookOpen size={16} /> },
    { name: 'Preporuči i zaradi', href: '/dashboard/preporuke', icon: <Share2 size={16} /> },
    { name: 'Postavke profila', href: '/dashboard/postavke', icon: <Settings size={16} /> },
  ];

  const navigation = isLoggedIn ? privateNavigation : publicNavigation;

  if (role === 'admin') {
    navigation.unshift({ name: 'Admin Panel', href: '/admin', icon: <Shield size={16} /> });
  }

  return (
    <header className="bg-white border-b border-zinc-200 sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <Logo />
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="ml-4 hidden md:flex gap-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all text-xs font-medium ${
                  pathname === item.href 
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                    : 'bg-white border-zinc-200 text-zinc-600 hover:border-indigo-200 hover:bg-zinc-50'
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
            {role !== 'admin' && appSettings && (
              <>
                {appSettings.facebook_url && (
                  <Link href={appSettings.facebook_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-600 hover:border-indigo-200 hover:bg-zinc-50 transition-all">
                    <Facebook size={16} />
                  </Link>
                )}
                {appSettings.instagram_url && (
                  <Link href={appSettings.instagram_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-600 hover:border-indigo-200 hover:bg-zinc-50 transition-all">
                    <Instagram size={16} />
                  </Link>
                )}
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {isLoggedIn ? (
            <>
              <Link 
                href="/kosarica" 
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-600 hover:border-indigo-200 hover:bg-zinc-50 transition-all"
              >
                <ShoppingCart size={16} />
                Košarica
              </Link>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden p-2 text-zinc-500 hover:text-zinc-900 rounded-md"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              {/* Desktop Logout */}
              <div className="hidden md:block">
                {logoutAction && (
                  <form action={logoutAction}>
                    <button type="submit" onClick={() => clearCart()} className="text-sm font-medium text-zinc-600 hover:text-zinc-900 flex items-center gap-2">
                      <LogOut size={16} />
                      Odjava
                    </button>
                  </form>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Mobile Menu Button for Public Users */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden p-2 text-zinc-500 hover:text-zinc-900 rounded-md"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <Link href="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
                Prijava
              </Link>
              <Link href="/register" className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors">
                Registracija
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-zinc-200 pb-4 px-4 shadow-lg">
          <nav className="flex flex-col space-y-2 mt-2">
            {isLoggedIn && navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-2 py-2 px-3 rounded-xl border transition-all text-base font-medium ${
                  pathname === item.href
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'bg-white border-zinc-200 text-zinc-600 hover:border-indigo-200 hover:bg-zinc-50'
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
            
            {isLoggedIn && (
              <Link
                href="/kosarica"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 py-2 px-3 rounded-xl border border-zinc-200 bg-white text-base font-medium text-zinc-600 hover:border-indigo-200 hover:bg-zinc-50 transition-all"
              >
                <ShoppingCart size={18} />
                Košarica
              </Link>
            )}

            {role !== 'admin' && appSettings && (
              <>
                {appSettings.facebook_url && (
                  <Link href={appSettings.facebook_url} target="_blank" rel="noopener noreferrer" onClick={() => setIsOpen(false)} className="flex items-center gap-2 py-2 px-3 rounded-xl border border-zinc-200 bg-white text-base font-medium text-zinc-600 hover:border-indigo-200 hover:bg-zinc-50 transition-all">
                    <Facebook size={18} />
                    Facebook
                  </Link>
                )}
                {appSettings.instagram_url && (
                  <Link href={appSettings.instagram_url} target="_blank" rel="noopener noreferrer" onClick={() => setIsOpen(false)} className="flex items-center gap-2 py-2 px-3 rounded-xl border border-zinc-200 bg-white text-base font-medium text-zinc-600 hover:border-indigo-200 hover:bg-zinc-50 transition-all">
                    <Instagram size={18} />
                    Instagram
                  </Link>
                )}
              </>
            )}

            {isLoggedIn && logoutAction && (
              <div className="pt-4 mt-4 border-t border-zinc-200">
                <form action={logoutAction}>
                  <button 
                    type="submit" 
                    onClick={() => clearCart()}
                    className="w-full text-left flex items-center gap-2 py-2 px-3 rounded-xl text-base font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={18} />
                    Odjava
                  </button>
                </form>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
