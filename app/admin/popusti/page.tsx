import { createClient } from '@/lib/supabase/server';
import DiscountForm from './DiscountForm';

export default async function AdminDiscountsPage() {
  const supabase = await createClient();
  
  const { data: templates } = await supabase
    .from('discount_templates')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Predlošci popusta</h1>
      </div>
      
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
        <h2 className="text-xl font-bold text-zinc-900 mb-6">Dodaj novi predložak popusta</h2>
        <DiscountForm />
      </div>

      <div className="mt-8 bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
        <h2 className="text-xl font-bold text-zinc-900 mb-6">Aktivni predlošci</h2>
        {templates && templates.length > 0 ? (
          <div className="space-y-4">
            {templates.map((template: any) => (
              <div key={template.id} className="flex justify-between items-center p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                <div>
                  <h3 className="font-bold text-zinc-900">{template.name}</h3>
                  <p className="text-sm text-zinc-600">
                    Popust: {template.value}%
                    {template.expires_at && ` | Istječe: ${new Date(template.expires_at).toLocaleDateString('hr-HR')}`}
                  </p>
                </div>
                <div className="text-sm font-medium text-indigo-600">
                  {template.is_active ? 'Aktivan' : 'Neaktivan'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-zinc-500">Nema definiranih predložaka popusta.</p>
        )}
      </div>
    </div>
  );
}
