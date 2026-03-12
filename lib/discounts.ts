import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

export async function generateAndSendWelcomeDiscount(userId: string, email: string) {
  const supabase = await createClient();
  
  try {
    const { data: templates } = await supabase
      .from('discount_templates')
      .select('*')
      .eq('is_active', true);

    if (templates && templates.length > 0) {
      for (const template of templates) {
        // Check if user already has a discount from this template
        const { data: existingDiscount } = await supabase
          .from('user_discounts')
          .select('id')
          .eq('user_id', userId)
          .eq('value', template.value)
          .maybeSingle();
          
        if (existingDiscount) continue;

        const code = crypto.randomBytes(4).toString('hex').toUpperCase();
        const expiresAtDate = template.expires_at ? new Date(template.expires_at) : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

        await supabase
          .from('user_discounts')
          .insert([{
            user_id: userId,
            code,
            value: template.value,
            expires_at: expiresAtDate.toISOString(),
          }]);

        await sendEmail({
          to: email,
          subject: 'Potvrda registracije i vaš popust - StudyWorks',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
              <h2 style="color: #4f46e5;">Registracija potvrđena!</h2>
              <p>Poštovani,</p>
              <p>Vaša registracija je uspješno potvrđena. Kao znak dobrodošlice, pripremili smo vam popust od ${template.value}%.</p>
              <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; font-size: 24px; font-weight: bold; color: #1f2937;">
                ${code}
              </div>
              <p>Kod vrijedi do: <strong>${expiresAtDate.toLocaleDateString('hr-HR')}</strong>.</p>
              <p>Srdačan pozdrav,<br/>StudyWorks Tim</p>
            </div>
          `,
        });
      }
    }
  } catch (err) {
    console.error('Error generating automatic discount:', err);
  }
}
