'use server';

import { createClient } from '@/lib/supabase/server';

export async function validateReferralCode(code: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // Check if code exists
  const { data: referrer, error } = await supabase
    .from('profiles')
    .select('id, referral_code')
    .eq('referral_code', code)
    .single();

  if (error || !referrer) {
    return { valid: false, message: 'Kod ne postoji.' };
  }

  // Check if it's own code
  if (referrer.id === user.id) {
    return { valid: false, message: 'Ne možete koristiti vlastiti kod.' };
  }

  // Check if user has already made an order (first order only)
  const { count } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', user.id);

  // Check if user has already used this specific code
  const { count: usedCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', user.id)
    .eq('referral_code_used', code);

  if (usedCount && usedCount > 0) {
    return { valid: false, message: 'Već ste iskoristili ovaj kod.' };
  }

  if (count && count > 0) {
    return { valid: false, message: 'Kod vrijedi samo za prvu narudžbu.' };
  }

  return { valid: true, discountCents: 500 }; // 5 EUR
}

export async function getReferralStats() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  let profile = null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('referral_code, credits_cents, email')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching referral stats (profile):', error);
    } else {
      profile = data;
    }
  } catch (err) {
    console.error('Exception fetching referral stats:', err);
  }

  // Generate code if missing (and if profile exists)
  if (profile && !profile.referral_code) {
    try {
      const emailToUse = profile.email || user.email || 'user';
      const baseCode = emailToUse.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toLowerCase();
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const newCode = (baseCode.length < 3 ? 'user' : baseCode) + randomDigits;

      // Update profile
      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update({ referral_code: newCode })
        .eq('id', user.id)
        .select('referral_code')
        .single();
        
      if (!error && updatedProfile) {
          profile.referral_code = updatedProfile.referral_code;
      } else if (error) {
          console.error('Error updating referral code:', error);
      }
    } catch (err) {
      console.error('Exception generating referral code:', err);
    }
  }

  // Count successful referrals (where referrer_rewarded is true)
  let successfulReferrals = 0;
  if (profile?.referral_code) {
    try {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('referral_code_used', profile.referral_code)
        .eq('referrer_rewarded', true);
      successfulReferrals = count || 0;
    } catch (err) {
      console.error('Error counting referrals:', err);
    }
  }

  return {
    referralCode: profile?.referral_code || null,
    creditsCents: profile?.credits_cents || 0,
    successfulReferrals
  };
}
