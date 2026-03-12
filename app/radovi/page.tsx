import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function WorksPage() {
  const supabase = await createClient();
  
  const { data: works } = await supabase
    .from('portfolio_works')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-zinc-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 mb-8">Naši radovi</h1>
        
        {works && works.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {works.map((work: any) => (
              <div key={work.id} className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
                <h3 className="text-xl font-bold text-zinc-900 mb-2">{work.title}</h3>
                <p className="text-zinc-600 mb-6">{work.description}</p>
                <a href={work.file_url} target="_blank" rel="noopener noreferrer" className="inline-block px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
                  Pogledaj rad
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-zinc-200">
            <p className="text-zinc-500">Trenutno nema objavljenih radova.</p>
          </div>
        )}
      </div>
    </div>
  );
}
