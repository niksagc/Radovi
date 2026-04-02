import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    await resend.emails.send({
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: email,
      subject: 'Dobrodošli u StudyWorks newsletter!',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4f46e5;">Dobrodošli!</h1>
          <p>Hvala vam na prijavi na naš newsletter. Očekujte korisne savjete i novosti iz StudyWorksa.</p>
          <p>Srdačan pozdrav,</p>
          <p>StudyWorks tim</p>
        </div>
      `,
    });

    return NextResponse.json({ message: 'Welcome email sent' });
  } catch (err: any) {
    console.error('Welcome email error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
