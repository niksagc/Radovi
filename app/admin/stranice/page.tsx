import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';

export default async function AdminPagesList() {
  const supabase = await createClient();
  
  const { data: pages } = await supabase
    .from('pages')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-zinc-900">Upravljanje stranicama</h1>
        <Link 
          href="/admin/stranice/nova" 
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nova stranica
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Naslov
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Slug
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Datum
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Akcije</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-zinc-200">
            {pages && pages.length > 0 ? (
              pages.map((page: any) => (
                <tr key={page.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">
                    {page.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                    /p/{page.slug}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {page.is_published ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Objavljeno
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-zinc-100 text-zinc-800 flex items-center gap-1">
                        <EyeOff className="w-3 h-3" /> Skica
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                    {new Date(page.created_at).toLocaleDateString('hr-HR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-3">
                      <Link href={`/p/${page.slug}`} target="_blank" className="text-zinc-600 hover:text-zinc-900">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link href={`/admin/stranice/${page.id}`} className="text-indigo-600 hover:text-indigo-900">
                        <Edit className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-zinc-500">
                  Nema kreiranih stranica.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
