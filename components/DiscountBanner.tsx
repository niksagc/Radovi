'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function DiscountBanner() {
  const [discount, setDiscount] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchActiveDiscount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data } = await supabase
        .from('discounts')
        .select('*')
        .eq('is_main_banner', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
        // Check if user already used this discount
        if (user) {
          const { data: usedDiscount } = await supabase
            .from('user_discounts')
            .select('id')
            .eq('user_id', user.id)
            .eq('code', data.code)
            .eq('is_used', true)
            .maybeSingle();

          if (usedDiscount) return; // Already used
        }

        const now = new Date();
        const validFrom = data.valid_from ? new Date(data.valid_from) : null;
        const validUntil = data.valid_until ? new Date(data.valid_until) : null;
        
        if ((!validFrom || now >= validFrom) && (!validUntil || now <= validUntil)) {
          setDiscount(data);
        }
      }
    };
    fetchActiveDiscount();
  }, [supabase]);

  if (!discount) return null;
  
  // Don't show in admin dashboard
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <div className="bg-pink-600 text-white text-center py-2 px-4 text-sm font-medium">
      Kupon: <span className="font-bold bg-white text-pink-600 px-2 py-0.5 rounded">{discount.code}</span> za {discount.discount_percent}% popusta!
    </div>
  );
}
