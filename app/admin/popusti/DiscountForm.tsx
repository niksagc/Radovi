'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function DiscountForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const discount = {
      name: formData.get('name') as string,
      type: formData.get('type') as string,
      value: parseFloat(formData.get('value') as string),
      is_active: true,
    };

    try {
      const { error: insertError } = await supabase
        .from('discounts')
        .insert([discount]);

      if (insertError) throw insertError;

      setSuccess(true);
      router.refresh();
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      console.error('Discount insert error:', err);
      setError(err.message || 'Greška pri dodavanju popusta.');
    }
    
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm">
          Popust je uspješno dodan.
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">Naziv popusta</label>
        <input
          type="text"
          name="name"
          required
          className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="npr. Popust za prvu narudžbu"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Tip popusta</label>
          <select
            name="type"
            required
            className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="first_order">Prva narudžba</option>
            <option value="bulk_items">2+ artikla</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Postotak (%)</label>
          <input
            type="number"
            name="value"
            required
            min="0"
            max="100"
            className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="npr. 10"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm text-sm disabled:opacity-70"
      >
        {loading ? 'Spremanje...' : 'Spremi popust'}
      </button>
    </form>
  );
}
