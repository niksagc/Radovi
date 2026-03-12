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
  
  // Check if username exists using a direct query (allowed by public policy)
  let usernameExists = false;
  try {
    const { data: profileData, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking username (Direct Query) Message:', checkError.message);
      console.error('Error checking username (Direct Query) Code:', checkError.code);
      
      // Fallback: try RPC if direct query fails (unlikely if policy is correct)
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('check_username_exists', { u: username });
      
      if (rpcError) {
        console.error('Error checking username (RPC) Message:', rpcError.message);
        console.error('Error checking username (RPC) Code:', rpcError.code);
      } else {
        usernameExists = !!rpcData;
      }
    } else {
      usernameExists = !!profileData;
    }
  } catch (err) {
    console.error('Unexpected error checking username:', err);
  }
    
  if (usernameExists) {
    return { error: 'Korisničko ime je već zauzeto.' };
  }
  
  console.log('Attempting signup for:', email);
  
  // First attempt: with full metadata
  let { data, error } = await supabase.auth.signUp({
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
  
  // Second attempt: if first fails with "Database error", try without metadata
  if (error && (error.message.includes('Database error') || error.message.includes('saving new user'))) {
    console.warn('Signup with metadata failed, retrying without metadata...');
    const retry = await supabase.auth.signUp({
      email,
      password
    });
    data = retry.data;
    error = retry.error;
  }
  
  if (error) {
    console.error('Signup error object:', JSON.stringify(error, null, 2));
    
    // If user already exists, try to sign in instead
    if (
      error.message.includes('User already registered') || 
      error.status === 422 || 
      error.code === 'user_already_exists' ||
      (error.message.includes('Database error') && error.message.includes('duplicate key'))
    ) {
      console.log('User likely already exists, attempting signin...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (!signInError) {
        console.log('Signin successful after signup failure');
        redirect('/dashboard');
      }
      
      console.error('Signin error after signup failure:', signInError.message);
      return { error: 'Korisnik već postoji s ovim e-mailom, ali lozinka je netočna.' };
    }

    console.error('Signup error message:', error.message);
    return { error: `Greška pri registraciji: ${error.message}` };
  }

  // Automatic discount code generation
  try {
    const { data: templates } = await supabase
      .from('discount_templates')
      .select('*')
      .eq('is_active', true);

    if (templates && templates.length > 0) {
      const { sendEmail } = await import('@/lib/email');
      const crypto = await import('crypto');

      for (const template of templates) {
        const code = crypto.randomBytes(4).toString('hex').toUpperCase();
        const expiresAtDate = template.expires_at ? new Date(template.expires_at) : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

        await supabase
          .from('user_discounts')
          .insert([{
            user_id: data.user!.id,
            code,
            value: template.value,
            expires_at: expiresAtDate.toISOString(),
          }]);

        await sendEmail({
          to: email,
          subject: 'Dobrodošli u StudyWorks - Vaš popust',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
              <h2 style="color: #4f46e5;">Dobrodošli u StudyWorks!</h2>
              <p>Poštovani,</p>
              <p>Hvala vam na registraciji. Kao znak dobrodošlice, pripremili smo vam popust od ${template.value}%.</p>
              <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; font-size: 24px; font-weight: bold; color: #1f2937;">
                ${code}
              </div>
              <p>Kod vrijedi do: <strong>${expiresAtDate.toLocaleDateString('hr-HR')}</strong>.</p>
              <p>Srdačan pozdrav,<br/>StudyWorks Tim</p>
            </div>
          `,
        });
      }
    }
  } catch (err) {
    console.error('Error generating automatic discount:', err);
  }
  
  console.log('Signup successful, redirecting to dashboard');
  redirect('/dashboard');
}
