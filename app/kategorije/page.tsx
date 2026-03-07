import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function CategoriesPage() {
  const supabase = await createClient();
  
  const { data: categories } = await supabase
    .from('categories')
    .select('*, items(*)')
    .order('sort_order', { ascending: true });

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
            <Link href="/dashboard" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
              Nadzorna ploča
            </Link>
            <Link href="/kosarica" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
              Košarica
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 mb-8">
          Katalog usluga
        </h1>
        
        {categories && categories.length > 0 ? (
          <div className="space-y-12">
            {categories.map((category: any) => (
              <section key={category.id}>
                <h2 className="text-2xl font-bold text-zinc-900 mb-2">{category.name}</h2>
                {category.description && (
                  <p className="text-zinc-500 mb-6">{category.description}</p>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.items?.filter((i: any) => i.is_active && i.type === 'base').map((item: any) => (
                    <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 flex flex-col">
                      <h3 className="text-lg font-bold text-zinc-900 mb-2">{item.name}</h3>
                      <p className="text-zinc-500 text-sm mb-4 flex-grow">{item.description}</p>
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-100">
                        <span className="text-xl font-bold text-zinc-900">{(item.price_cents / 100).toFixed(2)} €</span>
                        <Link 
                          href={`/usluge/${item.id}`} 
                          className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                        >
                          Detalji
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-zinc-200">
            <p className="text-zinc-500">Katalog je trenutno prazan.</p>
          </div>
        )}
      </main>
    </div>
  );
}
