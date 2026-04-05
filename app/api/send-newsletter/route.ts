import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateDiscountCode } from '@/lib/utils/discount';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { subject, html } = await req.json();
    const supabase = await createClient();

    // 1. Get all subscribers and registered users
    const { data: subscribers, error: subError } = await supabase
      .from('newsletter_subscribers')
      .select('email');

    const { data: profiles, error: profError } = await supabase
      .from('profiles')
      .select('email');

    if (subError) throw subError;
    if (profError) throw profError;

    const allUsers = [...(subscribers || []), ...(profiles || [])];
    
    // Remove duplicates based on email
    const uniqueUsers = Array.from(new Map(allUsers.map(user => [user.email, user])).values());

    if (uniqueUsers.length === 0) {
      return NextResponse.json({ message: 'Nema korisnika za slanje.' }, { status: 400 });
    }

    // 2. Send personalized emails
    for (const user of uniqueUsers) {
      // Generate a code based on the subject (campaign) and user email to ensure uniqueness per campaign
      const campaignPrefix = subject.replace(/\s+/g, '-').toUpperCase();
      const code = generateDiscountCode(campaignPrefix);
      
      const personalizedHtml = html.replace('{{DISCOUNT_CODE}}', code);
      
      await resend.emails.send({
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        to: user.email,
        subject: subject,
        html: personalizedHtml,
      });
    }

    return NextResponse.json({ message: 'Newsletter uspješno poslan svim korisnicima!' });
  } catch (err: any) {
    console.error('Newsletter sending error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
