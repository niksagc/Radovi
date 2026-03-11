'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { sendCredentialsEmail } from '@/lib/email';
import { revalidatePath } from 'next/cache';

export async function createNewUser(formData: FormData) {
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const email = formData.get('email') as string;
  const role = formData.get('role') as string;
  const password = formData.get('password') as string;

  if (!firstName || !lastName || !email || !role || !password) {
    return { error: 'Sva polja su obavezna.' };
  }

  const supabaseAdmin = createAdminClient();

  try {
    // Create auth user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name: firstName, last_name: lastName }
    });

    if (createError) {
      return { error: 'Greška pri kreiranju korisnika: ' + createError.message };
    }

    if (newUser.user) {
      // Create profile
      const { error: profileError } = await supabaseAdmin.from('profiles').insert({
        id: newUser.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        role: role as 'student' | 'admin'
      });

      if (profileError) {
        return { error: 'Greška pri kreiranju profila: ' + profileError.message };
      }

      // Send credentials email
      await sendCredentialsEmail({ 
        email, 
        name: `${firstName} ${lastName}`, 
        password 
      });
    }

    revalidatePath('/admin/korisnici');
    return { success: true };
  } catch (error: any) {
    console.error('Create user error:', error);
    return { error: 'Neočekivana greška: ' + error.message };
  }
}
