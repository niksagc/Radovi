import { createClient } from '@/lib/supabase/server';
import DiscountForm from './DiscountForm';

export default async function AdminDiscountsPage() {
  const supabase = await createClient();
  
  const { data: discounts } = await supabase
    .from('discounts')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Popusti</h1>
      </div>
      
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
        <h2 className="text-xl font-bold text-zinc-900 mb-6">Dodaj novi popust</h2>
        <DiscountForm />
      </div>

      <div className="mt-8 bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
        <h2 className="text-xl font-bold text-zinc-900 mb-6">Aktivni popusti</h2>
        {discounts && discounts.length > 0 ? (
          <div className="space-y-4">
            {discounts.map((discount: any) => (
              <div key={discount.id} className="flex justify-between items-center p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                <div>
                  <h3 className="font-bold text-zinc-900">{discount.name}</h3>
                  <p className="text-sm text-zinc-600">
                    {discount.type === 'first_order' ? 'Prva narudžba' : 
                     discount.type === 'bulk_items' ? `2+ artikla` : 'Popust'} - {discount.value}%
                  </p>
                </div>
                <div className="text-sm font-medium text-indigo-600">
                  {discount.is_active ? 'Aktivan' : 'Neaktivan'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-zinc-500">Nema definiranih popusta.</p>
        )}
      </div>
    </div>
  );
}
