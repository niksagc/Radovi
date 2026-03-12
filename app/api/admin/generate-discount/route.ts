import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

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
    const { email, value, expiresAt } = body;

    if (!email || !value) {
      return NextResponse.json({ error: 'Email i vrijednost popusta su obavezni' }, { status: 400 });
    }

    // Get user ID by email
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'Korisnik nije pronađen' }, { status: 404 });
    }

    // Generate unique code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();

    // Calculate expiry date
    const expiresAtDate = expiresAt ? new Date(expiresAt) : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    // Insert into user_discounts
    const { error: insertError } = await supabase
      .from('user_discounts')
      .insert([{
        user_id: userData.id,
        code,
        value,
        expires_at: expiresAtDate.toISOString(),
      }]);

    if (insertError) throw insertError;

    // Send email
    await sendEmail({
      to: email,
      subject: 'Vaš osobni popust - StudyWorks',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #4f46e5;">Vaš osobni popust</h2>
          <p>Poštovani,</p>
          <p>Za vas smo generirali poseban kod za popust od ${value}%.</p>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; font-size: 24px; font-weight: bold; color: #1f2937;">
            ${code}
          </div>
          <p>Kod vrijedi do: <strong>${expiresAtDate.toLocaleDateString('hr-HR')}</strong>.</p>
          <p>Srdačan pozdrav,<br/>StudyWorks Tim</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, code });
  } catch (error: any) {
    console.error('Generate discount error:', error);
    return NextResponse.json({ error: 'Došlo je do greške prilikom generiranja popusta' }, { status: 500 });
  }
}
