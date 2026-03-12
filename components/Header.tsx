'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LogOut, ShoppingCart, Package, LayoutGrid, BookOpen, Share2, Settings, Shield } from 'lucide-react';
import Logo from '@/components/Logo';

export default function Header({ logoutAction, role }: { logoutAction?: () => Promise<void>, role?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const isLoggedIn = !!role;

  const navigation = [
    { name: 'Moje narudžbe', href: '/dashboard', icon: <Package size={16} /> },
    { name: 'Katalog usluga', href: '/kategorije', icon: <LayoutGrid size={16} /> },
    { name: 'Blog', href: '/p/blog', icon: <BookOpen size={16} /> },
    { name: 'Preporuči i zaradi', href: '/dashboard/preporuke', icon: <Share2 size={16} /> },
    { name: 'Postavke profila', href: '/dashboard/postavke', icon: <Settings size={16} /> },
  ];

  if (role === 'admin') {
    navigation.unshift({ name: 'Admin Panel', href: '/admin', icon: <Shield size={16} /> });
  }

  return (
    <header className="bg-white border-b border-zinc-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <Link href={isLoggedIn ? "/dashboard" : "/"} className="flex items-center">
            <Logo />
          </Link>
          
          {/* Desktop Navigation */}
          {isLoggedIn && (
            <nav className="ml-10 hidden md:flex space-x-3">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-sm font-medium ${
                    pathname === item.href 
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                      : 'bg-white border-zinc-200 text-zinc-600 hover:border-indigo-200 hover:bg-zinc-50'
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              ))}
            </nav>
          )}
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
                    <button type="submit" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 flex items-center gap-2">
                      <LogOut size={16} />
                      Odjava
                    </button>
                  </form>
                )}
              </div>
            </>
          ) : (
            <>
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
      {isLoggedIn && isOpen && (
        <div className="md:hidden bg-white border-b border-zinc-200 pb-4 px-4 shadow-lg">
          <nav className="flex flex-col space-y-2 mt-2">
            {navigation.map((item) => (
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
            
            <Link
              href="/kosarica"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 py-2 px-3 rounded-xl border border-zinc-200 bg-white text-base font-medium text-zinc-600 hover:border-indigo-200 hover:bg-zinc-50 transition-all"
            >
              <ShoppingCart size={18} />
              Košarica
            </Link>

            <div className="pt-4 mt-4 border-t border-zinc-200">
              {logoutAction && (
                <form action={logoutAction}>
                  <button 
                    type="submit" 
                    className="w-full text-left flex items-center gap-2 py-2 px-3 rounded-xl text-base font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={18} />
                    Odjava
                  </button>
                </form>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
