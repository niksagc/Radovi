-- Migration to create user_discounts table
CREATE TABLE IF NOT EXISTS public.user_discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT,
  code TEXT NOT NULL,
  value INT NOT NULL DEFAULT 0,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, code),
  CONSTRAINT user_or_email CHECK (user_id IS NOT NULL OR email IS NOT NULL)
);

-- Enable RLS
ALTER TABLE public.user_discounts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own discounts" ON public.user_discounts FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can insert own discounts" ON public.user_discounts FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can update own discounts" ON public.user_discounts FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admins can manage all discounts" ON public.user_discounts USING (public.is_admin());

-- Add code column to discount_templates if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discount_templates' AND column_name = 'code') THEN
    ALTER TABLE public.discount_templates ADD COLUMN code TEXT;
  END IF;
END $$;

-- Add discount tracking columns to orders table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'discount_code_used') THEN
    ALTER TABLE public.orders ADD COLUMN discount_code_used TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'discount_amount_cents') THEN
    ALTER TABLE public.orders ADD COLUMN discount_amount_cents INT DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'referral_code_used') THEN
    ALTER TABLE public.orders ADD COLUMN referral_code_used TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'referral_discount_cents') THEN
    ALTER TABLE public.orders ADD COLUMN referral_discount_cents INT DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'credits_used_cents') THEN
    ALTER TABLE public.orders ADD COLUMN credits_used_cents INT DEFAULT 0;
  END IF;
END $$;

-- Insert default PRVA10 discount code if it doesn't exist
INSERT INTO public.discount_codes (code, discount_percent, is_active)
VALUES ('PRVA10', 10, true)
ON CONFLICT (code) DO NOTHING;
