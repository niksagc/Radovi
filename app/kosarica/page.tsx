'use client';

import { useCartStore } from '@/lib/store/cart';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import UserHeader from '../dashboard/UserHeader';
import { logout } from '@/app/login/actions';

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    
    const fetchDiscounts = async () => {
      const { data } = await supabase
        .from('discounts')
        .select('*')
        .eq('is_active', true);
      if (data) setDiscounts(data);
    };
    
    checkUser();
    fetchDiscounts();
  }, [supabase.auth]);

  if (!mounted) return null;

  const subtotalCents = items.filter(i => i.type === 'base').reduce((total, item) => total + (item.priceCents * item.quantity), 0);
  const addonsTotalCents = items.filter(i => i.type === 'addon').reduce((total, item) => total + (item.priceCents * item.quantity), 0);
  const totalCents = subtotalCents + addonsTotalCents;

  // Apply discounts
  let discountAmountCents = 0;
  
  // 1. Bulk items discount (2+ items)
  const bulkDiscount = discounts.find(d => d.type === 'bulk_items');
  if (bulkDiscount && items.length >= 2) {
    discountAmountCents += Math.round(totalCents * (bulkDiscount.value / 100));
  }

  // 2. First order discount (if user is logged in and it's their first order)
  // This is a simplified check, assuming we can check orders count
  const firstOrderDiscount = discounts.find(d => d.type === 'first_order');
  if (firstOrderDiscount && user) {
    // In a real app, we would check if user has any completed orders.
    // For now, we'll skip the check and assume it applies if the discount exists.
    discountAmountCents += Math.round(totalCents * (firstOrderDiscount.value / 100));
  }

  const finalTotalCents = Math.max(0, totalCents - discountAmountCents);

  const handleCheckout = () => {
    router.push('/narudzba');
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {user ? (
        <div className="sticky top-0 z-50 w-full">
          <UserHeader logoutAction={logout} />
        </div>
      ) : (
        <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
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
              <Link href="/dashboard" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
                Nadzorna ploča
              </Link>
            </div>
          </div>
        </header>
      )}

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 relative z-0">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 mb-8">
          Košarica
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-zinc-200">
            <svg className="mx-auto h-12 w-12 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-zinc-900">Vaša košarica je prazna</h3>
            <p className="mt-1 text-sm text-zinc-500">Dodajte usluge iz kataloga kako biste nastavili.</p>
            <div className="mt-6">
              <Link href="/kategorije" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Pregledaj usluge
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 flex flex-col sm:flex-row items-start sm:items-center justify-between">
                  <div className="flex-grow mb-4 sm:mb-0">
                    <h3 className="text-lg font-bold text-zinc-900">{item.name}</h3>
                    <p className="text-sm text-zinc-500">
                      {item.type === 'base' ? 'Osnovna usluga' : 'Dodatak'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center border border-zinc-200 rounded-lg">
                      <button 
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="px-3 py-1 text-zinc-600 hover:bg-zinc-50 rounded-l-lg"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 text-zinc-900 font-medium">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-3 py-1 text-zinc-600 hover:bg-zinc-50 rounded-r-lg"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-lg font-bold text-zinc-900 w-24 text-right">
                      {((item.priceCents * item.quantity) / 100).toFixed(2)} €
                    </div>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700 p-2"
                      aria-label="Ukloni"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-between items-center pt-4">
                <Link href="/kategorije" className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">
                  &larr; Dodaj još usluga
                </Link>
                <button 
                  onClick={clearCart}
                  className="text-zinc-500 hover:text-zinc-700 font-medium text-sm"
                >
                  Isprazni košaricu
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 h-fit sticky top-24">
              <h2 className="text-xl font-bold text-zinc-900 mb-6">Sažetak narudžbe</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-zinc-600">
                  <span>Osnovne usluge</span>
                  <span>{(subtotalCents / 100).toFixed(2)} €</span>
                </div>
                {addonsTotalCents > 0 && (
                  <div className="flex justify-between text-zinc-600">
                    <span>Dodaci</span>
                    <span>{(addonsTotalCents / 100).toFixed(2)} €</span>
                  </div>
                )}
                {discountAmountCents > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Popust</span>
                    <span>-{(discountAmountCents / 100).toFixed(2)} €</span>
                  </div>
                )}
                <div className="border-t border-zinc-200 pt-4 flex justify-between items-center">
                  <span className="text-lg font-bold text-zinc-900">Ukupno</span>
                  <span className="text-2xl font-extrabold text-indigo-600">{(finalTotalCents / 100).toFixed(2)} €</span>
                </div>
              </div>

              <button 
                onClick={handleCheckout}
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm text-lg"
              >
                Nastavi na narudžbu
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
