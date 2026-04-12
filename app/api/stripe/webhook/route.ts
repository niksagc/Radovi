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

  console.log('Webhook event type:', event.type);

  if (event.type === 'payment_intent.succeeded' || event.type === 'checkout.session.completed') {
    const object = event.data.object as any;
    
    // For checkout session, we get metadata from the session object
    // For payment intent, we get it from the payment intent object
    const metadata = object.metadata || {};
    const orderId = metadata.orderId;
    const stage = metadata.stage;
    const userId = metadata.userId;
    const discountCode = metadata.discountCode;
    const paymentIntentId = event.type === 'checkout.session.completed' ? object.payment_intent : object.id;
    const amount = event.type === 'checkout.session.completed' ? object.amount_total : object.amount;

    console.log('Processing successful payment for Order:', orderId, 'Stage:', stage, 'Event:', event.type);
    
    if (!orderId) {
      console.error('No orderId found in metadata for event:', event.id);
      return NextResponse.json({ received: true });
    }

    // 1. Update or Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .update({ status: 'succeeded' })
      .eq('stripe_payment_intent_id', paymentIntentId)
      .select()
      .single();

    if (paymentError || !payment) {
      console.log('Payment record not found, creating one now...');
      await supabase.from('payments').insert({
        order_id: orderId,
        method: 'card',
        stage: stage || 'full',
        amount_cents: amount,
        status: 'succeeded',
        stripe_payment_intent_id: paymentIntentId,
        stripe_customer_id: object.customer as string,
      });
    }

    // 2. Update order status
    if (orderId) {
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (order) {
        console.log('Order found, current status:', order.status);
        let newStatus = order.status;
        
        // Determine new status based on stage
        if (stage === 'deposit') {
          newStatus = 'Uplaćen depozit - U izradi';
        } else if (stage === 'full') {
          newStatus = 'U izradi';
        } else if (stage === 'final') {
          newStatus = 'Završeno';
          // Unlock files
          await supabase.from('files').update({ is_locked: false }).eq('order_id', order.id);
        }

        console.log('Updating order status to:', newStatus);
        const { error: updateError } = await supabase
          .from('orders')
          .update({ status: newStatus })
          .eq('id', order.id);
          
        if (updateError) {
          console.error('Error updating order status:', updateError);
        }

        // 3. Mark discount as used if present
        if (discountCode && userId) {
          console.log('Marking discount code as used:', discountCode, 'for user:', userId);
          
          const { data: existing } = await supabase
            .from('user_discounts')
            .select('id')
            .eq('user_id', userId)
            .eq('code', discountCode)
            .maybeSingle();

          if (existing) {
            await supabase
              .from('user_discounts')
              .update({ is_used: true, used_at: new Date().toISOString() })
              .eq('id', existing.id);
          } else {
            await supabase
              .from('user_discounts')
              .insert({
                user_id: userId,
                code: discountCode,
                is_used: true,
                used_at: new Date().toISOString(),
                value: 0
              });
          }
        }
      } else {
        console.error('Order not found for ID:', orderId);
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
