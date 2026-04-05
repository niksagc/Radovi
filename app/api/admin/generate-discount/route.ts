import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';
import { generateDiscountCode } from '@/lib/utils/discount-code';

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
    const { emails, value, expiresAt, emailContent } = body;

    if (!emails || !Array.isArray(emails) || emails.length === 0 || !value) {
      return NextResponse.json({ error: 'Emailovi i vrijednost popusta su obavezni' }, { status: 400 });
    }

    // Get user IDs by emails
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id, email')
      .in('email', emails);

    if (userError || !userData || userData.length === 0) {
      return NextResponse.json({ error: 'Korisnici nisu pronađeni' }, { status: 404 });
    }

    const results = [];
    for (const user of userData) {
      // Generate unique code
      const code = generateDiscountCode();
      const expiresAtDate = expiresAt ? new Date(expiresAt) : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

      // Insert into user_discounts
      const { error: insertError } = await supabase
        .from('user_discounts')
        .insert([{
          user_id: user.id,
          code,
          value,
          expires_at: expiresAtDate.toISOString(),
        }]);

      if (insertError) continue;

      // Send email
      await sendEmail({
        to: user.email,
        subject: 'Vaš osobni popust - StudyWorks',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2 style="color: #4f46e5;">Vaš osobni popust</h2>
            <p>${emailContent || 'Poštovani,'}</p>
            <p>Za vas smo generirali poseban kod za popust od ${value}%.</p>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; font-size: 24px; font-weight: bold; color: #1f2937;">
              ${code}
            </div>
            <p>Kod vrijedi do: <strong>${expiresAtDate.toLocaleDateString('hr-HR')}</strong>.</p>
            <p>Srdačan pozdrav,<br/>StudyWorks Tim</p>
          </div>
        `,
      });
      results.push({ email: user.email, code });
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Generate discount error:', error);
    return NextResponse.json({ error: 'Došlo je do greške prilikom generiranja popusta' }, { status: 500 });
  }
}
