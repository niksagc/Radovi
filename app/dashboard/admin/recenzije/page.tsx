import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Check, X } from 'lucide-react';
import { revalidatePath } from 'next/cache';

export default async function AdminReviewsPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, profiles:student_id(first_name, last_name), items:service_id(name)')
    .order('created_at', { ascending: false });

  async function approveReview(formData: FormData) {
    'use server';
    const reviewId = formData.get('reviewId') as string;
    const supabase = await createClient();
    
    await supabase
      .from('reviews')
      .update({ is_approved: true })
      .eq('id', reviewId);
      
    revalidatePath('/dashboard/admin/recenzije');
  }

  async function deleteReview(formData: FormData) {
    'use server';
    const reviewId = formData.get('reviewId') as string;
    const supabase = await createClient();
    
    await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);
      
    revalidatePath('/dashboard/admin/recenzije');
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-zinc-900 mb-8">Upravljanje recenzijama</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-zinc-900">Korisnik</th>
                <th className="px-6 py-4 font-semibold text-zinc-900">Usluga</th>
                <th className="px-6 py-4 font-semibold text-zinc-900">Ocjena</th>
                <th className="px-6 py-4 font-semibold text-zinc-900">Komentar</th>
                <th className="px-6 py-4 font-semibold text-zinc-900">Status</th>
                <th className="px-6 py-4 font-semibold text-zinc-900 text-right">Akcije</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {reviews?.map((review: any) => (
                <tr key={review.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 text-zinc-900">
                    {review.profiles?.first_name} {review.profiles?.last_name}
                  </td>
                  <td className="px-6 py-4 text-zinc-600">
                    {review.items?.name || 'Nepoznato'}
                  </td>
                  <td className="px-6 py-4 text-zinc-900 font-bold">
                    {review.rating}/5
                  </td>
                  <td className="px-6 py-4 text-zinc-600 max-w-xs truncate" title={review.comment}>
                    {review.comment || '-'}
                  </td>
                  <td className="px-6 py-4">
                    {review.is_approved ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Odobreno
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Čeka odobrenje
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {!review.is_approved && (
                        <form action={approveReview}>
                          <input type="hidden" name="reviewId" value={review.id} />
                          <button 
                            type="submit"
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Odobri"
                          >
                            <Check size={18} />
                          </button>
                        </form>
                      )}
                      <form action={deleteReview}>
                        <input type="hidden" name="reviewId" value={review.id} />
                        <button 
                          type="submit"
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Obriši"
                          onClick={(e) => {
                            if (!confirm('Jeste li sigurni da želite obrisati ovu recenziju?')) {
                              e.preventDefault();
                            }
                          }}
                        >
                          <X size={18} />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {(!reviews || reviews.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                    Nema recenzija za prikaz.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
