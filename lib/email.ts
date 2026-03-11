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

export async function sendCredentialsEmail({
  email,
  name,
  password,
}: {
  email: string;
  name: string;
  password?: string;
}) {
  const loginUrl = `${process.env.APP_URL}/login`;
  
  return sendEmail({
    to: email,
    subject: `Vaši pristupni podaci za StudyWorks`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 30px; color: #1f2937;">
        <h1 style="color: #4f46e5; margin-bottom: 20px;">Dobrodošli u StudyWorks!</h1>
        <p>Poštovani/a <strong>${name}</strong>,</p>
        <p>Vaš račun je uspješno kreiran. Sada se možete prijaviti na platformu kako biste pratili svoje upite i narudžbe.</p>
        
        ${password ? `
        <div style="background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 8px; padding: 20px; margin: 25px 0;">
          <p style="margin-top: 0; font-weight: 600; color: #4b5563;">Vaši podaci za prijavu:</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 5px 0;"><strong>Lozinka:</strong> <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${password}</code></p>
          <p style="font-size: 12px; color: #9ca3af; margin-top: 15px;">* Preporučujemo da promijenite lozinku nakon prve prijave.</p>
        </div>
        ` : `
        <p>Možete se prijaviti koristeći svoj email: <strong>${email}</strong>.</p>
        `}
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${loginUrl}" style="background: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Prijavi se odmah</a>
        </div>
        
        <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 30px 0;" />
        <p style="font-size: 14px; color: #6b7280;">Ako niste zatražili ovaj račun, slobodno zanemarite ovaj email.</p>
        <p style="font-size: 14px; color: #6b7280;">Srdačan pozdrav,<br />StudyWorks Tim</p>
      </div>
    `,
  });
}
