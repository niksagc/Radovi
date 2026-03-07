'use client';

import { useCartStore } from '@/lib/store/cart';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function OrderForm({ profile }: { profile: any }) {
  const { items, subtotalCents, addonsTotalCents, totalCents, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Form state
  const [formData, setFormData] = useState({
    schoolName: '',
    topic: '',
    subject: '',
    mentorName: '',
    studentName: profile?.first_name && profile?.last_name ? `${profile.first_name} ${profile.last_name}` : '',
    className: '',
    cityDate: '',
    instructions: '',
    deadline: '',
    paymentModel: '100%',
  });

  const [clientUpload, setClientUpload] = useState<File | null>(null);
  const [schoolInstructions, setSchoolInstructions] = useState<File | null>(null);

  useEffect(() => {
    if (items.length === 0) {
      router.push('/kosarica');
    }
  }, [items, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Calculate revisions
      const revisionsIncluded = items
        .filter(i => i.type === 'base')
        .reduce((total, item) => total + (item.includedRevisions * item.quantity), 0);

      // 2. Calculate deposit/final
      // Default to 100% at creation, will be chosen at payment step
      const depositCents = totalCents();
      const finalCents = 0;

      // 3. Create Order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          student_id: profile.id,
          status: 'Čeka uplatu',
          school_name: formData.schoolName,
          topic: formData.topic,
          subject: formData.subject,
          mentor_name: formData.mentorName,
          student_name: formData.studentName,
          class_name: formData.className,
          city_date: formData.cityDate,
          instructions: formData.instructions,
          deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
          revisions_included: revisionsIncluded,
          subtotal_cents: subtotalCents(),
          addons_total_cents: addonsTotalCents(),
          total_cents: totalCents(),
          payment_model: '100%',
          deposit_cents: depositCents,
          final_cents: finalCents,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 4. Create Order Items & Addons
      const orderItems = items.filter(i => i.type === 'base').map(item => ({
        order_id: order.id,
        item_id: item.itemId,
        name: item.name,
        price_cents: item.priceCents,
        quantity: item.quantity,
      }));

      const orderAddons = items.filter(i => i.type === 'addon').map(item => ({
        order_id: order.id,
        item_id: item.itemId,
        name: item.name,
        price_cents: item.priceCents,
        quantity: item.quantity,
      }));

      if (orderItems.length > 0) {
        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
        if (itemsError) throw itemsError;
      }

      if (orderAddons.length > 0) {
        const { error: addonsError } = await supabase.from('order_addons').insert(orderAddons);
        if (addonsError) throw addonsError;
      }

      // 5. Upload files if any
      const uploadFile = async (file: File, kind: string) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${order.id}/${kind}/${fileName}`;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('filePath', filePath);
        formData.append('bucket', 'orders');

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Neuspješan prijenos datoteke');
        }

        const { error: dbError } = await supabase.from('files').insert({
          order_id: order.id,
          uploader_id: profile.id,
          kind,
          path: filePath,
          filename: file.name,
          size_bytes: file.size,
        });

        if (dbError) throw dbError;
      };

      if (clientUpload) await uploadFile(clientUpload, 'client_upload');
      if (schoolInstructions) await uploadFile(schoolInstructions, 'school_instructions');

      // 6. Clear cart and redirect to payment
      clearCart();
      router.push(`/placanje/${order.id}`);

    } catch (err: any) {
      console.error('Order creation error:', err);
      setError(err.message || 'Došlo je do pogreške prilikom kreiranja narudžbe.');
      setLoading(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Osnovni podaci */}
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-zinc-200">
          <h2 className="text-xl font-bold text-zinc-900 mb-6">Osnovni podaci o radu</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 mb-1">Naslov / Tema rada *</label>
              <input
                type="text"
                name="topic"
                required
                value={formData.topic}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Npr. Utjecaj klimatskih promjena na..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Predmet / Kolegij *</label>
              <input
                type="text"
                name="subject"
                required
                value={formData.subject}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Npr. Biologija"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Rok isporuke *</label>
              <input
                type="date"
                name="deadline"
                required
                value={formData.deadline}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Podaci za naslovnicu */}
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-zinc-200">
          <h2 className="text-xl font-bold text-zinc-900 mb-6">Podaci za naslovnicu (opcionalno)</h2>
          <p className="text-sm text-zinc-500 mb-6">Ispunite ako želite da uredimo naslovnicu vašeg rada.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 mb-1">Naziv i adresa škole/fakulteta</label>
              <input
                type="text"
                name="schoolName"
                value={formData.schoolName}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Npr. Sveučilište u Zagrebu..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Ime i prezime mentora</label>
              <input
                type="text"
                name="mentorName"
                value={formData.mentorName}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Npr. prof. dr. sc. Ivan Horvat"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Ime i prezime studenta/učenika</label>
              <input
                type="text"
                name="studentName"
                value={formData.studentName}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Razred / Godina</label>
              <input
                type="text"
                name="className"
                value={formData.className}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Npr. 3.a ili 2. godina"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Mjesto i datum</label>
              <input
                type="text"
                name="cityDate"
                value={formData.cityDate}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Npr. Zagreb, svibanj 2026."
              />
            </div>
          </div>
        </div>

        {/* Upute i datoteke */}
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-zinc-200">
          <h2 className="text-xl font-bold text-zinc-900 mb-6">Upute i datoteke</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Dodatne upute za urednika</label>
              <textarea
                name="instructions"
                rows={4}
                value={formData.instructions}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-zinc-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Opišite što točno trebate, na što da obratimo pažnju..."
              ></textarea>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Vaš rad (Nacrt)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                  onChange={(e) => setClientUpload(e.target.files?.[0] || null)}
                  className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <p className="mt-1 text-xs text-zinc-500">PDF, DOCX, PPTX</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Upute mentora / škole</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.png"
                  onChange={(e) => setSchoolInstructions(e.target.files?.[0] || null)}
                  className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <p className="mt-1 text-xs text-zinc-500">PDF, DOCX, JPG, PNG</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sažetak i plaćanje */}
      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-zinc-200 h-fit sticky top-24">
        <h2 className="text-xl font-bold text-zinc-900 mb-6">Sažetak narudžbe</h2>
        
        <div className="space-y-4 mb-6">
          <div className="flex justify-between text-zinc-600">
            <span>Osnovne usluge</span>
            <span>{(subtotalCents() / 100).toFixed(2)} €</span>
          </div>
          {addonsTotalCents() > 0 && (
            <div className="flex justify-between text-zinc-600">
              <span>Dodaci</span>
              <span>{(addonsTotalCents() / 100).toFixed(2)} €</span>
            </div>
          )}
          <div className="border-t border-zinc-200 pt-4 flex justify-between items-center">
            <span className="text-lg font-bold text-zinc-900">Ukupno</span>
            <span className="text-2xl font-extrabold text-indigo-600">{(totalCents() / 100).toFixed(2)} €</span>
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm text-lg disabled:opacity-70"
        >
          {loading ? 'Spremanje...' : 'Nastavi na plaćanje'}
        </button>
      </div>
    </form>
  );
}
