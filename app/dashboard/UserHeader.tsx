'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LogOut, ShoppingCart } from 'lucide-react';

export default function UserHeader({ logoutAction, role }: { logoutAction: () => Promise<void>, role?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navigation = [
    { name: 'Moje narudžbe', href: '/dashboard' },
    { name: 'Katalog usluga', href: '/kategorije' },
    { name: 'Blog', href: '/p/blog' },
    { name: 'Preporuči i zaradi', href: '/dashboard/preporuke' },
    { name: 'Postavke profila', href: '/dashboard/postavke' },
  ];

  if (role === 'admin') {
    navigation.unshift({ name: 'Admin Panel', href: '/admin' });
  }

  return (
    <header className="bg-white border-b border-zinc-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/dashboard" className="text-2xl font-bold text-indigo-600 tracking-tight">
            StudyWorks
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="ml-10 hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === item.href 
                    ? 'text-indigo-600' 
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {/* Cart Link (Always visible or responsive?) - Let's keep it visible on desktop, maybe icon on mobile */}
          <Link 
            href="/kosarica" 
            className="hidden md:flex items-center text-sm font-medium text-zinc-600 hover:text-zinc-900 gap-2"
          >
            <ShoppingCart size={18} />
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
            <form action={logoutAction}>
              <button type="submit" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 flex items-center gap-2">
                <LogOut size={16} />
                Odjava
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-zinc-200 pb-4 px-4 shadow-lg">
          <nav className="flex flex-col space-y-2 mt-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`block py-2 px-3 rounded-md text-base font-medium ${
                  pathname === item.href
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
              >
                {item.name}
              </Link>
            ))}
            
            <Link
              href="/kosarica"
              onClick={() => setIsOpen(false)}
              className="block py-2 px-3 rounded-md text-base font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 flex items-center gap-2"
            >
              <ShoppingCart size={18} />
              Košarica
            </Link>

            <div className="pt-4 mt-4 border-t border-zinc-200">
              <form action={logoutAction}>
                <button 
                  type="submit" 
                  className="w-full text-left block py-2 px-3 rounded-md text-base font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut size={18} />
                  Odjava
                </button>
              </form>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
