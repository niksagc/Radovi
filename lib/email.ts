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
