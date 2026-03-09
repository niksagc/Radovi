import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Star, Check, X, Trash2, User, Package } from 'lucide-react';
import { revalidatePath } from 'next/cache';

async function approveReview(id: string) {
  'use server';
  const supabase = await createClient();
  const { error } = await supabase
    .from('reviews')
    .update({ is_approved: true })
    .eq('id', id);
  
  if (error) throw error;
  revalidatePath('/dashboard/admin/recenzije');
}

async function deleteReview(id: string) {
  'use server';
  const supabase = await createClient();
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  revalidatePath('/dashboard/admin/recenzije');
}

export default async function AdminReviewsPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      *,
      profiles:student_id(first_name, last_name, email),
      items:service_id(name)
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Upravljanje recenzijama</h1>
        <div className="bg-white px-4 py-2 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-600">
          Ukupno recenzija: {reviews?.length || 0}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Korisnik</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Usluga</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Ocjena</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Komentar</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Akcije</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-zinc-200">
            {reviews?.map((review: any) => (
              <tr key={review.id} className="hover:bg-zinc-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-zinc-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-zinc-900">
                        {review.profiles?.first_name} {review.profiles?.last_name}
                      </div>
                      <div className="text-xs text-zinc-500">{review.profiles?.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-zinc-600">
                    <Package className="w-4 h-4 mr-2 text-zinc-400" />
                    {review.items?.name || 'Nepoznata usluga'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`w-3 h-3 ${star <= review.rating ? 'text-yellow-400 fill-current' : 'text-zinc-200'}`} 
                      />
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-zinc-600 line-clamp-2 max-w-xs">{review.comment || '-'}</p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    review.is_approved 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {review.is_approved ? 'Odobreno' : 'Na čekanju'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    {!review.is_approved && (
                      <form action={approveReview.bind(null, review.id)}>
                        <button type="submit" className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Odobri">
                          <Check className="w-4 h-4" />
                        </button>
                      </form>
                    )}
                    <form action={deleteReview.bind(null, review.id)}>
                      <button type="submit" className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Obriši">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!reviews || reviews.length === 0) && (
          <div className="text-center py-12 text-zinc-500">Nema recenzija za prikaz.</div>
        )}
      </div>
    </div>
  );
}
