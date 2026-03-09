'use client';

import { useState } from 'react';
import { Star, Send, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface ReviewFormProps {
  orderId: string;
  studentId: string;
  serviceId?: string;
}

export default function ReviewForm({ orderId, studentId, serviceId }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Molimo odaberite ocjenu.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Niste prijavljeni.');

      const { error: submitError } = await supabase
        .from('reviews')
        .insert({
          order_id: orderId,
          student_id: studentId,
          service_id: serviceId,
          rating,
          comment,
          is_approved: false // Requires admin approval
        });

      if (submitError) throw submitError;

      setIsSubmitted(true);
      router.refresh();
    } catch (err: any) {
      console.error('Review submission error:', err);
      setError(err.message || 'Došlo je do pogreške prilikom slanja recenzije.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-green-50 border border-green-200 p-8 rounded-2xl text-center">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-green-900 mb-2">Hvala na recenziji!</h3>
        <p className="text-green-700">Vaša recenzija je poslana na odobrenje i bit će vidljiva uskoro.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
      <h2 className="text-2xl font-bold text-zinc-900 mb-2">Ostavite recenziju</h2>
      <p className="text-zinc-500 mb-8 text-sm">Vaše mišljenje nam je važno i pomaže drugim studentima.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-3">Ocjena usluge *</label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hover || rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-zinc-200'
                  }`}
                />
              </button>
            ))}
            <span className="ml-4 text-sm font-bold text-zinc-900">
              {rating > 0 ? `${rating} / 5` : ''}
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-zinc-700 mb-2">
            Vaš komentar (opcionalno)
          </label>
          <textarea
            id="comment"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Podijelite svoje iskustvo s ovom uslugom..."
            className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-white py-3 rounded-xl font-bold hover:bg-zinc-800 transition-colors disabled:opacity-70"
        >
          {isSubmitting ? (
            'Slanje...'
          ) : (
            <>
              <Send className="w-4 h-4" />
              Pošalji recenziju
            </>
          )}
        </button>
      </form>
    </div>
  );
}
