'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  const identifier = formData.get('identifier') as string;
  const password = formData.get('password') as string;
  
  if (!identifier || !password) {
    return { error: 'Molimo unesite korisničko ime/email i lozinku.' };
  }
  
  const supabase = await createClient();
  
  let email = identifier;
  
  // If it's not an email, assume it's a username and look up the email
  if (!identifier.includes('@')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', identifier)
      .single();
      
    if (profile && profile.email) {
      email = profile.email;
    } else {
      return { error: 'Korisnik nije pronađen.' };
    }
  }
  
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error || !authData.user) {
    return { error: 'Pogrešni podaci za prijavu.' };
  }
  
  // Check role to redirect
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .single();
    
  if (profileError) {
    console.error('Login profile fetch error:', JSON.stringify(profileError));
    
    if (profileError.code === 'PGRST205') {
      return { error: 'Baza podataka nije ispravno konfigurirana (tablice nedostaju).' };
    }

    if (profileError.code === 'PGRST116') {
      console.log('Profile missing on login, creating lazily...');
      const user = authData.user;
      const emailPrefix = user.email?.split('@')[0] || 'user';
      const fallbackUsername = `${emailPrefix}_${user.id.substring(0, 4)}`;

      await supabase.from('profiles').insert({
        id: user.id,
        email: user.email!,
        username: user.user_metadata?.username || fallbackUsername,
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '',
        role: 'student',
        referral_code: `ref_${Math.random().toString(36).substring(2, 10)}`
      });
      
      await supabase.from('user_settings').insert({ user_id: user.id });
      
      redirect('/dashboard');
    }
    
    // If profile is missing, it might be a new user from trigger or seed issue
    // We can try to create a default profile if it's missing, but for now just redirect to dashboard
    redirect('/dashboard');
  }
    
  if (profile?.role === 'admin') {
    redirect('/admin');
  } else {
    redirect('/dashboard');
  }
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
