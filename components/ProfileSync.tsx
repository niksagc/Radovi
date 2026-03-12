'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/store/cart';

export default function ProfileSync() {
  const supabase = createClient();
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const { userId, setUserId, clearCart } = useCartStore();

  useEffect(() => {
    const syncProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        if (userId !== user.id) {
          if (userId !== null) {
            clearCart();
          }
          setUserId(user.id);
        }
      } else {
        if (userId !== null) {
          clearCart();
          setUserId(null);
        }
      }

      if (!user) return;

      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error checking profile:', profileError);
        return;
      }

      // If profile doesn't exist, create it
      if (!profile) {
        console.log('Profile missing, creating lazily...');
        setSyncing(true);
        
        // Use email prefix as fallback for username
        const emailPrefix = user.email?.split('@')[0] || 'user';
        const fallbackUsername = `${emailPrefix}_${user.id.substring(0, 4)}`;

        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email!,
            username: user.user_metadata?.username || fallbackUsername,
            first_name: user.user_metadata?.first_name || '',
            last_name: user.user_metadata?.last_name || '',
            role: 'student',
            referral_code: `ref_${Math.random().toString(36).substring(2, 10)}`
          });

        if (insertError) {
          console.error('Error creating profile lazily:', insertError);
        } else {
          console.log('Profile created successfully');
          
          // Also create default settings
          await supabase
            .from('user_settings')
            .insert({ user_id: user.id })
            .select()
            .single();
            
          router.refresh();
        }
        setSyncing(false);
      }
    };

    syncProfile();
  }, [supabase, router, userId, setUserId, clearCart]);

  if (syncing) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-600 font-medium">Postavljanje vašeg profila...</p>
        </div>
      </div>
    );
  }

  return null;
}
