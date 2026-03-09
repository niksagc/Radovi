import { Resend } from 'resend';

// Only initialize if the key is present
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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
    console.warn('RESEND_API_KEY is not set. Email not sent:', subject);
    return { success: false, error: 'RESEND_API_KEY is missing in environment variables.' };
  }

  try {
    const data = await resend.emails.send({
      from: 'StudyWorks <onboarding@resend.dev>', // Default testing domain provided by Resend
      to,
      subject,
      html,
    });

    return { success: true, data };
  } catch (error: any) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
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
}: {
  name: string;
  email: string;
  subject: string;
  message: string;
  deadline?: string | null;
}) {
  // Get admin email from settings or env
  const adminEmail = process.env.ADMIN_EMAIL || 'nikoladuric025@gmail.com';

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
