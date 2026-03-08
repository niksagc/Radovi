import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AddToCartButton from './AddToCartButton';
import UserHeader from '../../dashboard/UserHeader';
import { logout } from '@/app/login/actions';
import { Star } from 'lucide-react';

export default async function ServiceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const resolvedParams = await params;
  
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: item } = await supabase
    .from('items')
    .select('*, categories(name)')
    .eq('id', resolvedParams.id)
    .single();

  if (!item) {
    notFound();
  }

  // Fetch reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, profiles:student_id(first_name, last_name)')
    .eq('service_id', item.id)
    .eq('is_approved', true)
    .order('created_at', { ascending: false });

  const averageRating = reviews && reviews.length > 0
  ? reviews.reduce((acc: number, review: { rating: number }) => acc + review.rating, 0) / reviews.length
  : 0;

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {user ? (
        <div className="sticky top-0 z-50 w-full">
          <UserHeader logoutAction={logout} />
        </div>
      ) : (
        <header className="bg-white border-b border-zinc-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-indigo-600 tracking-tight">
                StudyWorks
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/kategorije" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
                Katalog
              </Link>
              <Link href="/kosarica" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
                Košarica
              </Link>
              <Link href="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
                Prijava
              </Link>
            </div>
          </div>
        </header>
      )}

      <main className="flex-grow max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 relative z-0">
        <div className="mb-6">
          <Link href="/kategorije" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Natrag na katalog
          </Link>
        </div>
        
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200 mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              {item.categories?.name}
            </span>
            <div className="flex items-center gap-2">
              {averageRating > 0 && (
                <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-lg">
                  <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                  <span className="font-bold text-zinc-900">{averageRating.toFixed(1)}</span>
                  <span className="text-zinc-500 text-xs ml-1">({reviews?.length})</span>
                </div>
              )}
              <span className="text-2xl font-bold text-zinc-900">
                {(item.price_cents / 100).toFixed(2)} €
              </span>
            </div>
          </div>
          
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 mb-4">
            {item.name}
          </h1>
          
          <p className="text-zinc-600 text-lg mb-8">
            {item.description}
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            {item.max_pages && (
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                <p className="text-sm font-medium text-zinc-500">Maksimalno stranica</p>
                <p className="text-lg font-bold text-zinc-900">{item.max_pages}</p>
              </div>
            )}
            {item.max_slides && (
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                <p className="text-sm font-medium text-zinc-500">Maksimalno slajdova</p>
                <p className="text-lg font-bold text-zinc-900">{item.max_slides}</p>
              </div>
            )}
            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
              <p className="text-sm font-medium text-zinc-500">Uključene revizije</p>
              <p className="text-lg font-bold text-zinc-900">{item.included_revisions}</p>
            </div>
            {item.delivery_days && (
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                <p className="text-sm font-medium text-zinc-500">Rok isporuke</p>
                <p className="text-lg font-bold text-zinc-900">{item.delivery_days} dana</p>
              </div>
            )}
          </div>
          
          <AddToCartButton item={item} />
        </div>

        {/* Reviews Section */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
          <h2 className="text-xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
            Recenzije korisnika
            {reviews && reviews.length > 0 && (
              <span className="text-sm font-normal text-zinc-500 bg-zinc-100 px-2 py-1 rounded-full">
                {reviews.length}
              </span>
            )}
          </h2>

          {reviews && reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review: any) => (
                <div key={review.id} className="border-b border-zinc-100 last:border-0 pb-6 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">
                        {review.profiles?.first_name?.[0]}{review.profiles?.last_name?.[0]}
                      </div>
                      <span className="font-medium text-zinc-900">
                        {review.profiles?.first_name} {review.profiles?.last_name}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-400">
                      {new Date(review.created_at).toLocaleDateString('hr-HR')}
                    </span>
                  </div>
                  <div className="flex items-center mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-current' : 'text-zinc-200'}`} 
                      />
                    ))}
                  </div>
                  {review.comment && (
                    <p className="text-zinc-600 text-sm">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-500">
              Još nema recenzija za ovu uslugu.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
