import nodemailer from 'nodemailer';

// Configuration from environment variables
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.zoho.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL || SMTP_USER || 'info@studyworks.work.gd';
const FROM_NAME = process.env.FROM_NAME || 'StudyWorks';

// Create a transporter object using the default SMTP transport
const transporter = SMTP_USER && SMTP_PASS ? nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for 587
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  // Zoho requires this for some environments if using port 587
  tls: {
    rejectUnauthorized: false
  }
}) : null;

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!transporter) {
    console.warn('SMTP configuration is missing. Email not sent:', subject);
    return { success: false, error: 'SMTP configuration (SMTP_USER/SMTP_PASS) is missing.' };
  }

  console.log(`Sending email to: ${to}, subject: ${subject}, from: ${FROM_NAME} <${FROM_EMAIL}> via Zoho SMTP`);

  try {
    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });

    console.log('Email sent successfully:', info.messageId);
    return { success: true, data: info };
  } catch (error: any) {
    console.error('SMTP error:', error);
    
    let errorMessage = error.message;
    if (errorMessage.includes('535') || errorMessage.includes('Authentication Failed')) {
      errorMessage = 'Greška 535: Prijava nije uspjela. Provjerite SMTP_USER i SMTP_PASS. VAŽNO: Ako imate 2FA, MORATE koristiti "App Password", a ne običnu lozinku. Također provjerite je li SMTP omogućen u Zoho postavkama.';
    } else if (errorMessage.includes('Relay Access Denied')) {
      errorMessage = 'Pristup odbijen: Provjerite je li FROM_EMAIL ispravno postavljen na vašu Zoho adresu.';
    } else if (errorMessage.includes('ETIMEDOUT')) {
      errorMessage = 'Veza je istekla: Provjerite SMTP_HOST i SMTP_PORT (Zoho obično koristi 465).';
    }

    return { success: false, error: errorMessage };
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
