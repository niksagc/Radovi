import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const stripe = getStripe();
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile to check for stripe_customer_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, first_name, last_name')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      if (profileError.code === 'PGRST204' || profileError.message?.includes('stripe_customer_id')) {
        return NextResponse.json({ error: 'Database schema mismatch: stripe_customer_id column missing. Please run migration 0002.' }, { status: 500 });
      }
      return NextResponse.json({ error: 'Profile not found or database error' }, { status: 404 });
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    let customerId = profile.stripe_customer_id;

    if (!customerId) {
      // Create a new Stripe Customer
      const customer = await stripe.customers.create({
        email: profile.email,
        name: `${profile.first_name} ${profile.last_name}`,
        metadata: {
          supabase_uid: user.id,
        },
      });
      customerId = customer.id;

      // Update profile with stripe_customer_id
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating profile with stripe_customer_id:', updateError);
        // If update fails (e.g. column missing), we should probably fail the request
        // so the frontend knows something is wrong.
        throw new Error(`Failed to save Stripe Customer ID: ${updateError.message}`);
      }
    }

    // Create a SetupIntent
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
    });
  } catch (err: any) {
    console.error('Stripe error in create-setup-intent:', err);
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
}
