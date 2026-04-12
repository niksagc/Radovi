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
      .select('*, profiles(email, first_name, last_name, stripe_customer_id)')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Narudžba nije pronađena.' }, { status: 404 });
    }

    // Use discount code from body if provided, otherwise check order (fallback)
    const discountCode = bodyDiscountCode || (order as any).discount_code_used;

    const baseAmount = order.payment_model === '50-50' ? order.deposit_cents : order.total_cents;

    // Stripe fee calculation: 2.9% + 0.30€ (30 cents)
    const feePercentage = 0.029;
    const feeFixed = 30; // 0.30€ in cents
    const amountToPay = Math.ceil((baseAmount + feeFixed) / (1 - feePercentage));

    let customerId = order.profiles?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: order.profiles?.email,
        name: `${order.profiles?.first_name || ''} ${order.profiles?.last_name || ''}`.trim() || order.profiles?.email,
        metadata: {
          supabase_uid: order.student_id,
        },
      });
      customerId = customer.id;
      
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', order.student_id);
    }

    const stage = order.payment_model === '50-50' ? 'deposit' : 'full';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Narudžba #${order.id.substring(0, 8)} - ${stage === 'deposit' ? 'Depozit (50%)' : 'Plaćanje u cijelosti'}`,
              description: `Akademska podrška StudyWorks. Uključuje Stripe naknadu.`,
            },
            unit_amount: amountToPay,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/narudzbe/${order.id}?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/placanje/${order.id}?payment=cancel`,
      metadata: {
        orderId: order.id,
        stage: stage,
        discountCode: discountCode || '',
        userId: order.student_id,
      },
      payment_intent_data: {
        metadata: {
          orderId: order.id,
          stage: stage,
          discountCode: discountCode || '',
          userId: order.student_id,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe Checkout error:', err);
    return NextResponse.json({ 
      error: err.message || 'Došlo je do pogreške pri kreiranju sesije plaćanja.' 
    }, { status: 500 });
  }
}
