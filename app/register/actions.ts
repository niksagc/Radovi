'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function register(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const username = formData.get('username') as string;
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  
  if (!email || !password || !username) {
    return { error: 'Molimo ispunite sva obavezna polja.' };
  }
  
  const supabase = await createClient();
  
  // Check if username exists
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();
    
  if (existingUser) {
    return { error: 'Korisničko ime je već zauzeto.' };
  }
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        first_name: firstName,
        last_name: lastName,
      }
    }
  });
  
  if (error) {
    return { error: error.message };
  }
  
  // The trigger will handle creating the profile, but we might need to update it with first/last name
  if (data.user) {
    await supabase.from('profiles').update({
      first_name: firstName,
      last_name: lastName,
      username: username
    }).eq('id', data.user.id);
  }
  
  redirect('/dashboard');
}
