'use server';

import { createClient } from '@/lib/supabase/server';

export async function updatePassword(formData: FormData) {
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  
  if (!password || !confirmPassword) {
    return { error: 'Molimo unesite lozinku.' };
  }
  
  if (password !== confirmPassword) {
    return { error: 'Lozinke se ne podudaraju.' };
  }
  
  if (password.length < 6) {
    return { error: 'Lozinka mora imati najmanje 6 znakova.' };
  }
  
  const supabase = await createClient();
  
  const { error } = await supabase.auth.updateUser({
    password: password
  });
  
  if (error) {
    console.error('Update password error:', error.message);
    return { error: `Greška pri ažuriranju lozinke: ${error.message}` };
  }
  
  return { success: true };
}
