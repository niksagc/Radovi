import { createClient } from '@/lib/supabase/server';
import NewServiceForm from './NewServiceForm';

export default async function NewServicePage({ searchParams }: { searchParams: Promise<{ categoryId?: string }> }) {
  const supabase = await createClient();
  
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  const resolvedSearchParams = await searchParams;

  return (
    <div className="max-w-2xl mx-auto">
      <NewServiceForm categories={categories || []} initialCategoryId={resolvedSearchParams.categoryId} />
    </div>
  );
}
