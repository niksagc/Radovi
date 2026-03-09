'use server';

import { createClient } from '@/lib/supabase/server';

export async function resetPassword(formData: FormData) {
  const email = formData.get('email') as string;
  
  if (!email) {
    return { error: 'Molimo unesite email adresu.' };
  }
  
  const supabase = await createClient();
  
  const origin = process.env.APP_URL || 'http://localhost:3000';
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/azuriraj-lozinku`,
  });
  
  if (error) {
    console.error('Reset password error:', error.message);
    return { error: `Greška pri slanju maila: ${error.message}` };
  }
  
  return { success: true };
}
