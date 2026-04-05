'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import DiscountForm from './DiscountForm';

export default function AdminDiscountsPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const supabase = createClient();

  const fetchTemplates = useCallback(async () => {
    const { data } = await supabase
      .from('discount_templates')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setTemplates(data);
  }, [supabase]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const deleteTemplate = async (id: number) => {
    if (!confirm('Jeste li sigurni da želite obrisati ovaj predložak popusta?')) return;
    const { error } = await supabase.from('discount_templates').delete().eq('id', id);
    if (error) alert(error.message);
    else {
      alert('Predložak popusta obrisan!');
      fetchTemplates();
    }
  };

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
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium text-indigo-600">
                    {template.is_active ? 'Aktivan' : 'Neaktivan'}
                  </div>
                  <button 
                    onClick={() => deleteTemplate(template.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Obriši
                  </button>
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
