import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminCatalogPage() {
  const supabase = await createClient();
  
  const { data: categories } = await supabase
    .from('categories')
    .select('*, items(*)')
    .order('sort_order', { ascending: true });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Upravljanje katalogom</h1>
        <Link href="/admin/katalog/nova-kategorija" className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors text-sm">
          Nova kategorija
        </Link>
      </div>
      
      {categories && categories.length > 0 ? (
        <div className="space-y-8">
          {categories.map((category: any) => (
            <div key={category.id} className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
              <div className="bg-zinc-50 px-6 py-4 border-b border-zinc-200 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-zinc-900">{category.name}</h2>
                  <p className="text-sm text-zinc-500">{category.description}</p>
                </div>
                <div className="flex space-x-2">
                  <Link href={`/admin/katalog/kategorija/${category.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
                    Uredi
                  </Link>
                  <Link href={`/admin/katalog/nova-usluga?categoryId=${category.id}`} className="text-sm font-medium text-green-600 hover:text-green-900">
                    + Usluga
                  </Link>
                </div>
              </div>
              
              <div className="p-0">
                {category.items && category.items.length > 0 ? (
                  <table className="min-w-full divide-y divide-zinc-200">
                    <thead className="bg-white">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                          Naziv
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                          Cijena
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                          Tip
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Akcije</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-zinc-100">
                      {category.items.map((item: any) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">
                            {item.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                            {(item.price_cents / 100).toFixed(2)} €
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                            {item.type === 'addon' ? 'Dodatak' : 'Osnovna usluga'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {item.is_active ? 'Aktivno' : 'Neaktivno'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link href={`/admin/katalog/usluga/${item.id}`} className="text-indigo-600 hover:text-indigo-900">
                              Uredi
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="px-6 py-4 text-sm text-zinc-500">
                    Nema usluga u ovoj kategoriji.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-zinc-200">
          <p className="text-sm text-zinc-500">Nema kategorija.</p>
        </div>
      )}
    </div>
  );
}
