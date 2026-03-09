import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Niste prijavljeni' }, { status: 401 });
    }

    // Check if admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Nemate administratorska prava' }, { status: 403 });
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email adresa je obavezna' }, { status: 400 });
    }

    // Send the test email
    const result = await sendEmail({
      to: email,
      subject: 'Probni e-mail sa StudyWorks platforme',
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #4f46e5;">Uspješno slanje!</h2>
          <p>Ovo je probni e-mail poslan iz StudyWorks administracije.</p>
          <p>Ako vidite ovu poruku, to znači da je vaša konfiguracija za slanje e-mailova (Resend) ispravno postavljena.</p>
          <br/>
          <p style="color: #6b7280; font-size: 14px;">Srdačan pozdrav,<br/>StudyWorks Tim</p>
        </div>
      `,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Probni e-mail je uspješno poslan!' });
  } catch (error: any) {
    console.error('Test email error:', error);
    return NextResponse.json({ error: 'Došlo je do greške prilikom slanja e-maila' }, { status: 500 });
  }
}
