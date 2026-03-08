'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Star, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ReviewForm({ orderId, serviceId }: { orderId: string, serviceId: string | null }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('reviews')
        .insert({
          order_id: orderId,
          student_id: user.id,
          service_id: serviceId,
          rating,
          comment,
          is_approved: false // Requires admin approval
        });

      if (error) throw error;

      setIsSubmitted(true);
      router.refresh();
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Došlo je do pogreške prilikom slanja recenzije.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-green-50 p-6 rounded-2xl border border-green-200 text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-green-600">
          <Star className="w-6 h-6 fill-current" />
        </div>
        <h3 className="font-bold text-green-800 mb-1">Hvala na recenziji!</h3>
        <p className="text-green-700 text-sm">Vaša recenzija je poslana i bit će vidljiva nakon odobrenja administratora.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
      <h3 className="font-bold text-zinc-900 mb-4">Ocijenite uslugu</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-center space-x-2 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star 
                className={`w-8 h-8 ${
                  star <= (hoverRating || rating) 
                    ? 'text-yellow-400 fill-current' 
                    : 'text-zinc-300'
                }`} 
              />
            </button>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Vaš komentar (opcionalno)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full p-3 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            placeholder="Napišite svoje iskustvo..."
          />
        </div>

        <button
          type="submit"
          disabled={rating === 0 || isSubmitting}
          className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            'Slanje...'
          ) : (
            <>
              <Send size={18} />
              Pošalji recenziju
            </>
          )}
        </button>
      </form>
    </div>
  );
}
