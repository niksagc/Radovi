'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function DiscountBanner() {
  const [discount, setDiscount] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchActiveDiscount = async () => {
      const { data } = await supabase
        .from('discount_templates')
        .select('*')
        .eq('is_main_banner', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data) {
        const now = new Date();
        const expiresAt = data.expires_at ? new Date(data.expires_at) : null;
        
        if (!expiresAt || now <= expiresAt) {
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
      {discount.value}% Popusta na {discount.name}: <span className="font-bold bg-white text-pink-600 px-2 py-0.5 rounded">{discount.code || 'KOD'}</span>
    </div>
  );
}
