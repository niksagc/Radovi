import { createAdminClient } from '@/lib/supabase/admin';
import { Mail } from 'lucide-react';
import UpitItem from './UpitItem';

export const dynamic = 'force-dynamic';

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
            <UpitItem key={upit.id} upit={upit} />
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
