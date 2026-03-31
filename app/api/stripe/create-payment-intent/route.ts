import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const stripe = getStripe();
    const { orderId } = await request.json();

    const supabase = createAdminClient();
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Narudžba nije pronađena.' }, { status: 404 });
    }

    const baseAmount = order.payment_model === '50-50' ? order.deposit_cents : order.total_cents;

    // Stripe fee calculation: 2.9% + 0.30€ (30 cents)
    // Formula: (baseAmount + 30) / (1 - 0.029)
    const feePercentage = 0.029;
    const feeFixed = 30; // 0.30€ in cents
    const amountToPay = Math.ceil((baseAmount + feeFixed) / (1 - feePercentage));

    console.log('Creating PaymentIntent for order:', orderId, 'Base Amount:', baseAmount, 'Amount with Fee:', amountToPay);
    console.log('Order student_id:', order.student_id);

    // Get user profile to check for stripe_customer_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, first_name, last_name')
      .eq('id', order.student_id)
      .single();

    if (profileError) {
      console.error('Error fetching profile in create-payment-intent:', profileError);
    }

    let customerId = profile?.stripe_customer_id;
    console.log('Found customerId in profile:', customerId);

    if (!customerId && profile) {
      console.log('Creating new Stripe Customer for:', profile.email);
      // Create a new Stripe Customer if missing
      const customer = await stripe.customers.create({
        email: profile.email,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
        metadata: {
          supabase_uid: order.student_id,
        },
      });
      customerId = customer.id;
      console.log('New Stripe Customer created:', customerId);

      // Update profile with stripe_customer_id
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', order.student_id);
      
      if (updateError) {
        console.error('Error updating profile with new customerId:', updateError);
      }
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntentOptions: any = {
      amount: amountToPay,
      currency: 'eur',
      customer: customerId || undefined,
      setup_future_usage: 'off_session',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        orderId: order.id,
        stage: order.payment_model === '50-50' ? 'deposit' : 'full',
      },
    };

    // If we have a customer, we can also use the 'save_payment_method' preference
    // but automatic_payment_methods usually handles this if customer is present.
    
    console.log('Stripe PaymentIntent options:', JSON.stringify(paymentIntentOptions, null, 2));

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);
    console.log('PaymentIntent created successfully:', paymentIntent.id);


    // Save payment intent to database
    await supabase.from('payments').insert({
      order_id: order.id,
      method: 'card',
      stage: order.payment_model === '50-50' ? 'deposit' : 'full',
      amount_cents: amountToPay,
      status: 'pending',
      stripe_payment_intent_id: paymentIntent.id,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      baseAmount,
      amountToPay,
    });
  } catch (err: any) {
    console.error('Stripe error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
