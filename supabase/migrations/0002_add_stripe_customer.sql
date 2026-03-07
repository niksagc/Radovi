-- Add stripe_customer_id to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Create user_payment_methods table
CREATE TABLE IF NOT EXISTS public.user_payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_method_id TEXT NOT NULL,
  brand TEXT NOT NULL,
  last4 TEXT NOT NULL,
  exp_month INT NOT NULL,
  exp_year INT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_payment_methods ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own payment methods" ON public.user_payment_methods FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payment methods" ON public.user_payment_methods FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own payment methods" ON public.user_payment_methods FOR DELETE USING (auth.uid() = user_id);
