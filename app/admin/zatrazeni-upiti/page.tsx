import { createAdminClient } from '@/lib/supabase/admin';
import { Mail, Calendar, User, FileText, Download } from 'lucide-react';
import Link from 'next/link';

export default async function ZatrazeniUpitiPage() {
  const supabase = createAdminClient();

  const { data: upiti, error } = await supabase
    .from('preorder_contacts')
    .select(`
      *,
      files (*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="p-8 text-red-500">
        Greška pri učitavanju upita: {error.message}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Zatražene ponude</h1>
          <p className="text-zinc-400 mt-1">Pregled svih upita poslanih putem kontakt forme.</p>
        </div>
      </div>

      <div className="space-y-6">
        {upiti && upiti.length > 0 ? (
          upiti.map((upit: any) => (
            <div key={upit.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="p-6">
                <div className="flex flex-wrap justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                      <User size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{upit.name}</h3>
                      <div className="flex items-center gap-2 text-zinc-400 text-sm">
                        <Mail size={14} />
                        <a href={`mailto:${upit.email}`} className="hover:text-indigo-400 transition-colors">
                          {upit.email}
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Primljeno</span>
                    <span className="text-zinc-300">{new Date(upit.created_at).toLocaleDateString('hr-HR')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <div className="mb-4">
                      <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Predmet</span>
                      <p className="text-white font-medium">{upit.subject || 'Bez naslova'}</p>
                    </div>
                    <div className="mb-4">
                      <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Rok</span>
                      <div className="flex items-center gap-2 text-zinc-300">
                        <Calendar size={16} className="text-indigo-400" />
                        {upit.deadline ? new Date(upit.deadline).toLocaleDateString('hr-HR') : 'Nije navedeno'}
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Poruka</span>
                    <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 text-zinc-300 text-sm whitespace-pre-wrap">
                      {upit.message}
                    </div>
                  </div>
                </div>

                {upit.files && upit.files.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-zinc-800">
                    <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold block mb-3">Priložene datoteke</span>
                    <div className="flex flex-wrap gap-3">
                      {upit.files.map((file: any) => (
                        <div key={file.id} className="flex items-center gap-3 bg-zinc-800/50 p-3 rounded-lg border border-zinc-700">
                          <FileText size={20} className="text-indigo-400" />
                          <div className="flex flex-col">
                            <span className="text-sm text-white font-medium truncate max-w-[200px]">{file.filename}</span>
                            <span className="text-xs text-zinc-500">{(file.size_bytes / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                          {/* We would need a download link here, but for now just the info */}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-zinc-950/50 px-6 py-4 border-t border-zinc-800 flex justify-end gap-3">
                <button className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                  Označi kao obrađeno
                </button>
                <Link 
                  href={`mailto:${upit.email}?subject=Ponuda za: ${upit.subject}`}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Odgovori na upit
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-500">
              <Mail size={32} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Nema zatraženih upita</h3>
            <p className="text-zinc-400">Trenutno nema novih upita poslanih putem kontakt forme.</p>
          </div>
        )}
      </div>
    </div>
  );
}
