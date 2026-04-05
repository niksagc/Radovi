import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateDiscountCode } from '@/lib/utils/discount';
import { sendEmail } from '@/lib/email';

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
      // Generate a code
      const code = generateDiscountCode();
      
      // Save code to database
      const { error: insertError } = await supabase
        .from('discount_codes')
        .insert({
          code: code,
          discount_percent: 10, // Assuming 10% for newsletter
          is_active: true
        });

      if (insertError) {
        console.error('Error saving discount code:', insertError);
        continue;
      }
      
      const personalizedHtml = html.replace('{{DISCOUNT_CODE}}', code);
      
      await sendEmail({
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
