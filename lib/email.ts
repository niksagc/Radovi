import { Resend } from 'resend';

// Configuration from environment variables
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'info@studyworks.work.gd';
const FROM_NAME = process.env.FROM_NAME || 'StudyWorks';

// Initialize Resend
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resend) {
    console.warn('Resend API ključ nedostaje. Email nije poslan:', subject);
    return { success: false, error: 'Resend API ključ (RESEND_API_KEY) nedostaje.' };
  }

  console.log(`Pokušaj slanja emaila preko Resend-a:
    TO: ${to}
    FROM: ${FROM_NAME} <${FROM_EMAIL}>
  `);

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error('Resend greška:', error);
      return { success: false, error: error.message };
    }

    console.log('Email uspješno poslan:', data?.id);
    return { success: true, data };
  } catch (error: any) {
    console.error('Neočekivana greška pri slanju emaila:', error);
    return { success: false, error: error.message || 'Neočekivana greška pri slanju emaila.' };
  }
}

export async function sendPreorderConfirmationEmail({
  email,
  name,
  subject,
}: {
  email: string;
  name: string;
  subject: string;
}) {
  return sendEmail({
    to: email,
    subject: `Potvrda upita: ${subject}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4f46e5;">Pozdrav ${name},</h1>
        <p>Hvala vam što ste nam se obratili. Primili smo vaš upit za: <strong>${subject}</strong>.</p>
        <p>Naš tim će pregledati vaše zahtjeve i javiti vam se s ponudom u najkraćem mogućem roku.</p>
        <p>U međuvremenu, ako imate dodatnih pitanja, slobodno odgovorite na ovaj email.</p>
        <br />
        <p>Srdačan pozdrav,<br />StudyWorks Tim</p>
      </div>
    `,
  });
}

export async function sendPreorderAdminNotificationEmail({
  name,
  email,
  subject,
  message,
  deadline,
  to,
}: {
  name: string;
  email: string;
  subject: string;
  message: string;
  deadline?: string | null;
  to?: string;
}) {
  // Get admin email from parameter, settings or env
  const adminEmail = to || process.env.ADMIN_EMAIL || 'nikoladuric025@gmail.com';

  return sendEmail({
    to: adminEmail,
    subject: `NOVI UPIT: ${subject}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4f46e5;">Novi upit za ponudu</h1>
        <p><strong>Ime:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Predmet:</strong> ${subject}</p>
        <p><strong>Rok:</strong> ${deadline ? new Date(deadline).toLocaleDateString('hr-HR') : 'Nije navedeno'}</p>
        <p><strong>Poruka:</strong></p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px;">
          ${message.replace(/\n/g, '<br />')}
        </div>
        <br />
        <p><a href="${process.env.APP_URL}/admin/zatrazeni-upiti" style="background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Pogledaj u admin sustavu</a></p>
      </div>
    `,
  });
}
