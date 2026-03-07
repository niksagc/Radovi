'use client';

import { useCartStore } from '@/lib/store/cart';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddToCartButton({ item }: { item: any }) {
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);
  const router = useRouter();

  const handleAddToCart = () => {
    addItem({
      itemId: item.id,
      name: item.name,
      priceCents: item.price_cents,
      type: item.type,
      quantity: 1,
      maxPages: item.max_pages,
      maxSlides: item.max_slides,
      includedRevisions: item.included_revisions,
    });
    setAdded(true);
    setTimeout(() => {
      router.push('/kosarica');
    }, 500);
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={added}
      className={`w-full py-4 rounded-xl font-bold text-lg transition-colors shadow-sm ${
        added 
          ? 'bg-green-500 text-white hover:bg-green-600' 
          : 'bg-indigo-600 text-white hover:bg-indigo-700'
      }`}
    >
      {added ? 'Dodano u košaricu!' : 'Dodaj u košaricu'}
    </button>
  );
}
