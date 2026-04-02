import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { subject, html } = await req.json();
    const supabase = await createClient();

    // 1. Get all subscribers
    const { data: subscribers, error } = await supabase
      .from('newsletter_subscribers')
      .select('email');

    if (error) throw error;

    const emails = subscribers?.map((s: { email: string }) => s.email) || [];
    if (emails.length === 0) {
      return NextResponse.json({ message: 'Nema pretplatnika za slanje.' }, { status: 400 });
    }

    // 2. Send email via Resend
    // Note: Resend batch sending limit is 100 per request. 
    // For larger lists, you'd need to chunk this.
    const { data, error: resendError } = await resend.emails.send({
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: emails,
      subject: subject,
      html: html,
    });

    if (resendError) throw resendError;

    return NextResponse.json({ message: 'Newsletter uspješno poslan!', data });
  } catch (err: any) {
    console.error('Newsletter sending error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
