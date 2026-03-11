'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { sendPreorderConfirmationEmail, sendPreorderAdminNotificationEmail, sendCredentialsEmail } from '@/lib/email';

export async function submitContactForm(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const subject = formData.get('subject') as string;
  const deadline = formData.get('deadline') as string;
  const message = formData.get('message') as string;
  const file = formData.get('file') as File | null;

  if (!name || !email || !message) {
    return { error: 'Molimo ispunite sva obavezna polja.' };
  }

  const supabaseAdmin = createAdminClient();
  
  // 1. Auto-registration check
  try {
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser.users.some(u => u.email === email);

    if (!userExists) {
      // Create new user
      const password = Math.random().toString(36).substring(2, 12);
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { first_name: name.split(' ')[0], last_name: name.split(' ').slice(1).join(' ') }
      });

      if (!createError && newUser.user) {
        // Create profile
        await supabaseAdmin.from('profiles').insert({
          id: newUser.user.id,
          email,
          first_name: name.split(' ')[0],
          last_name: name.split(' ').slice(1).join(' '),
          role: 'student'
        });

        // Send credentials email
        await sendCredentialsEmail({ email, name, password });
      }
    }
  } catch (regError) {
    console.error('Auto-registration error:', regError);
    // Continue with inquiry even if registration fails
  }

  // 2. Insert contact
  const { data: contact, error: contactError } = await supabaseAdmin
    .from('preorder_contacts')
    .insert({
      name,
      email,
      subject,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      message,
    })
    .select()
    .single();

  if (contactError) {
    console.error('Contact insert error:', contactError);
    return { error: 'Greška pri spremanju upita: ' + contactError.message };
  }

  // 2. Upload file if exists
  if (file && file.size > 0) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${contact.id}/${fileName}`;

    // Ensure bucket exists
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    if (!buckets?.find((b: any) => b.name === 'preorders')) {
      await supabaseAdmin.storage.createBucket('preorders', {
        public: false,
        fileSizeLimit: 10485760, // 10MB
      });
    }

    const { error: uploadError } = await supabaseAdmin.storage
      .from('preorders')
      .upload(filePath, file, { 
        upsert: true,
        contentType: file.type
      });

    if (uploadError) {
      console.error('File upload error:', uploadError);
      return { error: 'Greška pri prijenosu datoteke: ' + uploadError.message };
    }

    const { error: dbError } = await supabaseAdmin.from('files').insert({
      preorder_contact_id: contact.id,
      kind: 'preorder',
      path: filePath,
      filename: file.name,
      size_bytes: file.size,
    });

    if (dbError) {
      console.error('File db insert error:', dbError);
      return { error: 'Greška pri spremanju podataka o datoteci: ' + dbError.message };
    }
  }

  // 3. Send emails
  try {
    // Fetch admin email from settings
    const { data: settings } = await supabaseAdmin
      .from('app_settings')
      .select('notification_emails')
      .single();
    
    const adminEmail = settings?.notification_emails?.[0] || process.env.ADMIN_EMAIL || 'nikoladuric025@gmail.com';

    await Promise.all([
      sendPreorderConfirmationEmail({ email, name, subject }),
      sendPreorderAdminNotificationEmail({ 
        name, 
        email, 
        subject, 
        message, 
        deadline,
        to: adminEmail
      })
    ]);
  } catch (emailError) {
    // We don't want to fail the whole request if email fails, but we should log it
    console.error('Email notification error:', emailError);
  }

  return { success: true };
}
