import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import PageForm from '../PageForm';

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const resolvedParams = await params;
  
  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('id', resolvedParams.id)
    .single();

  if (!page) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-zinc-900">Uredi stranicu: {page.title}</h1>
      <PageForm initialData={page} />
    </div>
  );
}
