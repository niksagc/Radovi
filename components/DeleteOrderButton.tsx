'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteOrder } from '@/lib/actions/orders';
import { useRouter } from 'next/navigation';

interface DeleteOrderButtonProps {
  orderId: string;
  userRole: 'student' | 'admin';
  status: string;
}

export default function DeleteOrderButton({ orderId, userRole, status }: DeleteOrderButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  // Check if order can be deleted
  const canDelete = ['Nacrt', 'Završeno', 'Otkazano', 'Otkazano zbog neplaćanja (2. dio)', 'Isteklo'].includes(status);

  if (!canDelete) return null;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation if button is inside a Link
    e.stopPropagation();

    if (!confirm('Jeste li sigurni da želite obrisati ovu narudžbu? Ovo će je sakriti s vašeg popisa.')) return;

    setIsDeleting(true);
    try {
      await deleteOrder(orderId, userRole);
      router.refresh();
    } catch (error) {
      alert('Greška pri brisanju narudžbe.');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      title="Obriši narudžbu"
    >
      <Trash2 className="w-5 h-5" />
    </button>
  );
}
