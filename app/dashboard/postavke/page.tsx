import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import StudentSettingsForm from './StudentSettingsForm';
import PaymentMethodsSettings from './PaymentMethodsSettings';

export default async function StudentSettingsPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: settings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Postavke profila</h1>
      </div>
      
      <div className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-zinc-200">
        <StudentSettingsForm initialProfile={profile} initialSettings={settings} />
        <PaymentMethodsSettings />
      </div>
    </div>
  );
}
