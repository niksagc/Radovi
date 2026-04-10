'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { usePathname } from 'next/navigation';

export default function DiscountBanner() {
  const [discount, setDiscount] = useState<any>(null);
  const [isUsed, setIsUsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const pathname = usePathname();

  useEffect(() => {
    const fetchActiveDiscount = async () => {
      try {
        // 1. Fetch active banner discount
        const { data: bannerDiscount } = await supabase
          .from('discount_templates')
          .select('*')
          .eq('is_main_banner', true)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (bannerDiscount) {
          const now = new Date();
          const expiresAt = bannerDiscount.expires_at ? new Date(bannerDiscount.expires_at) : null;
          
          if (!expiresAt || now <= expiresAt) {
            setDiscount(bannerDiscount);
            
            // 2. Check if user has used this code
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const code = bannerDiscount.code || (bannerDiscount.name.toUpperCase().replace(/\s/g, '').substring(0, 4) + bannerDiscount.value).toUpperCase();
              
              const { data: used } = await supabase
                .from('user_discounts')
                .select('id')
                .eq('user_id', user.id)
                .eq('code', code)
                .eq('is_used', true)
                .maybeSingle();
              
              if (used) {
                setIsUsed(true);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching discount banner info:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchActiveDiscount();
  }, [supabase]);

  // Hide conditions
  if (loading || !discount || isUsed) return null;
  
  // Don't show on login or admin pages
  if (pathname === '/login' || pathname?.startsWith('/admin')) {
    return null;
  }

  const generateCode = (name: string, value: number) => {
    return (name.toUpperCase().replace(/\s/g, '').substring(0, 4) + value).toUpperCase();
  };

  return (
    <div className="bg-pink-600 text-white text-center py-2 px-4 text-sm font-medium">
      {discount.value}% Popusta na {discount.name}: <span className="font-bold bg-white text-pink-600 px-2 py-0.5 rounded">{discount.code || generateCode(discount.name, discount.value)}</span>
    </div>
  );
}
