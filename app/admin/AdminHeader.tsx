'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LogOut, Home, LayoutDashboard, Package, MessageSquare, LayoutGrid, Users, FileText, Tag, FileStack, Settings } from 'lucide-react';
import Logo from '@/components/Logo';

export default function AdminHeader({ logoutAction }: { logoutAction: () => Promise<void> }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navigation = [
    { name: 'Početna', href: '/', icon: <Home size={16} /> },
    { name: 'Nadzorna ploča', href: '/admin', icon: <LayoutDashboard size={16} /> },
    { name: 'Narudžbe', href: '/admin/narudzbe', icon: <Package size={16} /> },
    { name: 'Zatražene ponude', href: '/admin/zatrazeni-upiti', icon: <MessageSquare size={16} /> },
    { name: 'Katalog', href: '/admin/katalog', icon: <LayoutGrid size={16} /> },
    { name: 'Korisnici', href: '/admin/korisnici', icon: <Users size={16} /> },
    { name: 'Stranice', href: '/admin/stranice', icon: <FileText size={16} /> },
    { name: 'Popusti', href: '/admin/popusti', icon: <Tag size={16} /> },
    { name: 'Radovi', href: '/admin/radovi', icon: <FileStack size={16} /> },
    { name: 'Postavke', href: '/admin/postavke', icon: <Settings size={16} /> },
  ];

  return (
    <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/admin" className="flex items-center">
            <Logo color="white" />
            <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest ml-2 mt-1 px-1.5 py-0.5 bg-indigo-400/10 rounded border border-indigo-400/20">
              Admin
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="ml-10 hidden md:flex space-x-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-sm font-medium ${
                  pathname === item.href 
                    ? 'bg-zinc-800 border-zinc-700 text-white' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-zinc-400 hover:text-white rounded-md"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Desktop Logout */}
          <div className="hidden md:block">
            <form action={logoutAction}>
              <button type="submit" className="text-sm font-medium text-zinc-300 hover:text-white flex items-center gap-2">
                <LogOut size={16} />
                Odjava
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-zinc-900 border-b border-zinc-800 pb-4 px-4">
          <nav className="flex flex-col space-y-2 mt-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-2 py-2 px-3 rounded-xl border transition-all text-base font-medium ${
                  pathname === item.href
                    ? 'bg-zinc-800 border-zinc-700 text-white'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
            <div className="pt-4 mt-4 border-t border-zinc-800">
              <form action={logoutAction}>
                <button 
                  type="submit" 
                  className="w-full text-left flex items-center gap-2 py-2 px-3 rounded-xl text-base font-medium text-red-400 hover:bg-zinc-800 hover:text-red-300"
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
