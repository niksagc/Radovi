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
    const { inquiryId, email, subject, message } = body;

    if (!inquiryId || !email || !message) {
      return NextResponse.json({ error: 'Sva polja su obavezna' }, { status: 400 });
    }

    // Send the email
    const result = await sendEmail({
      to: email,
      subject: subject || 'Odgovor na vaš upit - StudyWorks',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #4f46e5;">Odgovor na vaš upit</h2>
          <p>Poštovani,</p>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; white-space: pre-wrap; line-height: 1.6;">
            ${message.replace(/\n/g, '<br />')}
          </div>
          <p>Ako imate dodatnih pitanja, slobodno nam se obratite.</p>
          <br/>
          <p style="color: #6b7280; font-size: 14px;">Srdačan pozdrav,<br/>StudyWorks Tim</p>
        </div>
      `,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Update inquiry status
    await supabase
      .from('preorder_contacts')
      .update({ status: 'replied' })
      .eq('id', inquiryId);

    return NextResponse.json({ success: true, message: 'Odgovor je uspješno poslan!' });
  } catch (error: any) {
    console.error('Reply email error:', error);
    return NextResponse.json({ error: 'Došlo je do greške prilikom slanja odgovora' }, { status: 500 });
  }
}
