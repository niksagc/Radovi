import { createClient } from '@/lib/supabase/server';
import AdminSettingsForm from './AdminSettingsForm';
import ProfileSettingsForm from '@/components/ProfileSettingsForm';

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: appSettings } = await supabase
    .from('app_settings')
    .select('*')
    .single();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single();

  const { data: userSettings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user?.id)
    .single();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Postavke</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-zinc-200">
            <h2 className="text-xl font-bold text-zinc-900 mb-6">Postavke sustava</h2>
            <AdminSettingsForm initialSettings={appSettings} />
        </div>

        <div className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-zinc-200">
            <h2 className="text-xl font-bold text-zinc-900 mb-6">Osobni podaci</h2>
            <ProfileSettingsForm initialProfile={profile} initialSettings={userSettings} />
        </div>
      </div>
    </div>
  );
}
