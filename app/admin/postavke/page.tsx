import { createClient } from '@/lib/supabase/server';
import AdminSettingsForm from './AdminSettingsForm';

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  
  const { data: settings } = await supabase
    .from('app_settings')
    .select('*')
    .single();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Postavke sustava</h1>
      </div>
      
      <div className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-zinc-200">
        <AdminSettingsForm initialSettings={settings} />
      </div>
    </div>
  );
}
