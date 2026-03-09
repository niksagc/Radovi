'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function sendMagicLink(formData: FormData) {
  const email = formData.get('email') as string;
  
  if (!email) {
    return { error: 'Molimo unesite email adresu.' };
  }
  
  const supabase = await createClient();
  
  // Get the current origin for the redirect URL
  // In a production app, this would be your domain
  const origin = process.env.APP_URL || 'http://localhost:3000';
  
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  
  if (error) {
    console.error('Magic link error:', error.message);
    
    if (error.message.includes('Database error') || error.message.includes('saving new user')) {
      return { 
        error: 'Greška u bazi podataka. Molimo otvorite Supabase SQL Editor i pokrenite skriptu iz datoteke /supabase/migrations/9999_drop_triggers.sql kako biste uklonili stare okidače koji blokiraju registraciju.' 
      };
    }
    
    return { error: `Greška pri slanju maila: ${error.message}` };
  }
  
  return { success: true };
}

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
      return { error: 'Baza podataka nije ispravno konfigurirana (tablice nedostaju). Molimo pokrenite inicijalizaciju testnih podataka na dnu stranice.' };
    }

    if (profileError.code === 'PGRST116') {
      return { error: 'Vaš profil nije pronađen u bazi podataka. Molimo kliknite na "Inicijaliziraj testne podatke" na dnu stranice kako biste kreirali potrebne profile.' };
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
