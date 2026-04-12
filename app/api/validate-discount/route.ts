import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { code, userId } = await req.json();
    const supabase = await createClient();

    if (!code) {
      return NextResponse.json({ error: 'Kod je obavezan' }, { status: 400 });
    }

    // 1. Check global discounts table (discount_codes)
    const { data: globalDiscount, error: globalError } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single();

    if (globalDiscount) {
      // Check if it's a global code that should be used once per user
      if (userId) {
        const { data: usedDiscount } = await supabase
          .from('user_discounts')
          .select('id')
          .eq('user_id', userId)
          .eq('code', code)
          .eq('is_used', true)
          .maybeSingle();

        if (usedDiscount) {
          return NextResponse.json({ error: 'Ovaj kod ste već iskoristili.' }, { status: 400 });
        }
      }
      
      // Check validity dates
      const now = new Date();
      if (globalDiscount.valid_from && new Date(globalDiscount.valid_from) > now) {
        return NextResponse.json({ error: 'Kod još nije aktivan.' }, { status: 400 });
      }
      if (globalDiscount.valid_until && new Date(globalDiscount.valid_until) < now) {
        return NextResponse.json({ error: 'Kod je istekao.' }, { status: 400 });
      }

      return NextResponse.json({ 
        valid: true, 
        discount: {
          id: globalDiscount.id,
          code: globalDiscount.code,
          value: globalDiscount.discount_percent,
          type: 'global'
        } 
      });
    }

    // 2. Check personalized user discounts
    if (userId) {
      const { data: userDiscount, error: userError } = await supabase
        .from('user_discounts')
        .select('*')
        .eq('code', code)
        .eq('user_id', userId)
        .eq('is_used', false)
        .eq('is_active', true)
        .single();

      if (userDiscount) {
        // Check expiry
        if (userDiscount.expires_at && new Date(userDiscount.expires_at) < new Date()) {
          return NextResponse.json({ error: 'Kod je istekao.' }, { status: 400 });
        }

        return NextResponse.json({ 
          valid: true, 
          discount: {
            id: userDiscount.id,
            code: userDiscount.code,
            value: userDiscount.value,
            type: 'personalized'
          } 
        });
      }
    }

    return NextResponse.json({ error: 'Nevažeći kod popusta.' }, { status: 404 });
  } catch (err: any) {
    console.error('Discount validation error:', err);
    return NextResponse.json({ error: 'Greška pri provjeri koda.' }, { status: 500 });
  }
}
