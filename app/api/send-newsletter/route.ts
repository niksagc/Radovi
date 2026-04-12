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
    let successCount = 0;
    let errorCount = 0;

    for (const user of uniqueUsers) {
      try {
        // Generate a code
        const code = generateDiscountCode();
        console.log(`Generated code for ${user.email}: ${code}`);
        
        // Save code to database
        const { error: insertError } = await supabase
          .from('user_discounts')
          .insert({
            code: code,
            value: 10,
            is_active: true,
            email: user.email
          });

        if (insertError) {
          console.error(`Error saving discount code for ${user.email}:`, JSON.stringify(insertError, null, 2));
          errorCount++;
          continue;
        }
        
        console.log(`Successfully saved code ${code} for ${user.email}`);
        
        const personalizedHtml = html.replace('{{DISCOUNT_CODE}}', code);
        
        const emailResult = await sendEmail({
          to: user.email,
          subject: subject,
          html: personalizedHtml,
        });

        if (!emailResult.success) {
          console.error(`Error sending email to ${user.email}:`, emailResult.error);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        console.error(`Unexpected error processing user ${user.email}:`, err);
        errorCount++;
      }
    }

    return NextResponse.json({ 
      message: `Newsletter proces završen. Uspješno poslano: ${successCount}, Greške: ${errorCount}` 
    });
  } catch (err: any) {
    console.error('Newsletter sending error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
