import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe';

export async function POST(request: Request) {
  const payload = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event;

  try {
    const stripe = getStripe();
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!endpointSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
    }
    // Use constructEvent from the stripe instance
    // Note: constructEvent is synchronous but verifies signature
    event = stripe.webhooks.constructEvent(payload, sig!, endpointSecret);
  } catch (err: any) {
    console.error('Webhook Error:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const supabase = createAdminClient();

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    
    // Update payment record
    const { data: payment } = await supabase
      .from('payments')
      .update({ status: 'succeeded' })
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .select()
      .single();

    if (payment) {
      // Update order status
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('id', payment.order_id)
        .single();

      if (order) {
        let newStatus = order.status;
        if (payment.stage === 'deposit') {
          newStatus = 'Uplaćen depozit - U izradi';
        } else if (payment.stage === 'full') {
          newStatus = 'U izradi';
        } else if (payment.stage === 'final') {
          newStatus = 'Završeno';
          // Unlock files
          await supabase.from('files').update({ is_locked: false }).eq('order_id', order.id);
        }

        await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
      }
    }
  } else if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    await supabase
      .from('payments')
      .update({ status: 'failed' })
      .eq('stripe_payment_intent_id', paymentIntent.id);
  }

  return NextResponse.json({ received: true });
}
