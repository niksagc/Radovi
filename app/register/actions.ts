'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function register(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const username = formData.get('username') as string;
  const fullName = formData.get('fullName') as string;
  
  if (!email || !password || !username || !fullName) {
    return { error: 'Molimo ispunite sva obavezna polja.' };
  }
  
  if (password.length < 8) {
    return { error: 'Lozinka mora imati minimalno 8 znakova.' };
  }
  
  const supabase = await createClient();
  
  // Check if username exists
  const { data: profileData } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle();
    
  if (profileData) {
    return { error: 'Korisničko ime je već zauzeto.' };
  }
  
  console.log('Attempting signup for:', email);
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        full_name: fullName,
      }
    }
  });
  
  if (error) {
    console.error('Signup error message:', error.message);
    return { error: `Greška pri registraciji: ${error.message}` };
  }

  // Automatic discount code generation
  if (data.user) {
    try {
      const { generateAndSendWelcomeDiscount } = await import('@/lib/discounts');
      await generateAndSendWelcomeDiscount(data.user.id, email);
    } catch (err) {
      console.error('Error generating automatic discount:', err);
    }
  }
  
  console.log('Signup successful, redirecting to dashboard');
  redirect('/dashboard');
}
