import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const stripe = getStripe();
    const { orderId, discountCode: bodyDiscountCode } = await request.json();

    const supabase = createAdminClient();
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Narudžba nije pronađena.' }, { status: 404 });
    }

    // Use discount code from body if provided, otherwise check order (fallback)
    const discountCode = bodyDiscountCode || (order as any).discount_code_used;

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

    const createNewCustomer = async () => {
      console.log('Creating new Stripe Customer for:', profile.email);
      const customer = await stripe.customers.create({
        email: profile.email,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
        metadata: {
          supabase_uid: order.student_id,
        },
      });
      
      // Update profile with stripe_customer_id
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customer.id })
        .eq('id', order.student_id);
        
      return customer.id;
    };

    if (!customerId && profile) {
      customerId = await createNewCustomer();
    }

    // Create a PaymentIntent with the order amount and currency
    let paymentIntent;
    try {
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
          discountCode: discountCode || undefined,
          userId: order.student_id,
        },
      };

      console.log('Stripe PaymentIntent options:', JSON.stringify(paymentIntentOptions, null, 2));
      paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);
    } catch (paymentError: any) {
      // If customer doesn't exist in Stripe (e.g. switched from test to live or deleted)
      if (paymentError.message?.includes('No such customer') || paymentError.code === 'resource_missing') {
        console.log('Customer ID was invalid, creating new one and retrying...');
        customerId = await createNewCustomer();
        
        // Retry PaymentIntent creation with new customerId
        paymentIntent = await stripe.paymentIntents.create({
          amount: amountToPay,
          currency: 'eur',
          customer: customerId,
          setup_future_usage: 'off_session',
          automatic_payment_methods: {
            enabled: true,
          },
          metadata: {
            orderId: order.id,
            stage: order.payment_model === '50-50' ? 'deposit' : 'full',
            discountCode: discountCode || undefined,
            userId: order.student_id,
          },
        });
      } else {
        throw paymentError;
      }
    }

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
    console.error('Stripe error details:', err);
    return NextResponse.json({ 
      error: err.message || 'Došlo je do nepoznate greške na Stripe poslužitelju.',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 });
  }
}
