import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AddToCartButton from './AddToCartButton';

export default async function ServiceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const resolvedParams = await params;
  
  const { data: item } = await supabase
    .from('items')
    .select('*, categories(name)')
    .eq('id', resolvedParams.id)
    .single();

  if (!item) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
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
            <Link href="/kosarica" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
              Košarica
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <Link href="/kategorije" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Natrag na katalog
          </Link>
        </div>
        
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              {item.categories?.name}
            </span>
            <span className="text-2xl font-bold text-zinc-900">
              {(item.price_cents / 100).toFixed(2)} €
            </span>
          </div>
          
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 mb-4">
            {item.name}
          </h1>
          
          <p className="text-zinc-600 text-lg mb-8">
            {item.description}
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            {item.max_pages && (
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                <p className="text-sm font-medium text-zinc-500">Maksimalno stranica</p>
                <p className="text-lg font-bold text-zinc-900">{item.max_pages}</p>
              </div>
            )}
            {item.max_slides && (
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                <p className="text-sm font-medium text-zinc-500">Maksimalno slajdova</p>
                <p className="text-lg font-bold text-zinc-900">{item.max_slides}</p>
              </div>
            )}
            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
              <p className="text-sm font-medium text-zinc-500">Uključene revizije</p>
              <p className="text-lg font-bold text-zinc-900">{item.included_revisions}</p>
            </div>
            {item.delivery_days && (
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                <p className="text-sm font-medium text-zinc-500">Rok isporuke</p>
                <p className="text-lg font-bold text-zinc-900">{item.delivery_days} dana</p>
              </div>
            )}
          </div>
          
          <AddToCartButton item={item} />
        </div>
      </main>
    </div>
  );
}
