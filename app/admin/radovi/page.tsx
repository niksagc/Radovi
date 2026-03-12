import { createClient } from '@/lib/supabase/server';
import UploadWorkForm from './UploadWorkForm';

export default async function AdminWorksPage() {
  const supabase = await createClient();
  
  const { data: works } = await supabase
    .from('portfolio_works')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Radovi</h1>
      </div>
      
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200 mb-8">
        <h2 className="text-xl font-bold text-zinc-900 mb-6">Dodaj novi rad</h2>
        <UploadWorkForm />
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
        <h2 className="text-xl font-bold text-zinc-900 mb-6">Pregled radova</h2>
        {works && works.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {works.map((work: any) => (
              <div key={work.id} className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                <h3 className="font-bold text-zinc-900">{work.title}</h3>
                <p className="text-sm text-zinc-600 mb-4">{work.description}</p>
                <a href={work.file_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                  Pregledaj PDF
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-zinc-500">Nema dodanih radova.</p>
        )}
      </div>
    </div>
  );
}
