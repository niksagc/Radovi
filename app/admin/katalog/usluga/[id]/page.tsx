import { createClient } from '@/lib/supabase/server';
import EditServiceForm from './EditServiceForm';
import { notFound } from 'next/navigation';

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: item } = await supabase
    .from('items')
    .select('*')
    .eq('id', id)
    .single();

  if (!item) {
    notFound();
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  return (
    <div className="max-w-2xl mx-auto">
      <EditServiceForm item={item} categories={categories || []} />
    </div>
  );
}
