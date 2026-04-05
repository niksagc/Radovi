-- Migration to add discount codes and tracking
CREATE TABLE public.discount_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  value INT NOT NULL,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_main_banner BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.discount_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  discount_percent INT NOT NULL,
  min_order_amount_cents INT DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.used_discount_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  discount_code_id UUID REFERENCES public.discount_codes(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, discount_code_id)
);

-- Enable RLS
ALTER TABLE public.discount_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.used_discount_codes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can read active discount codes" ON public.discount_codes FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage discount codes" ON public.discount_codes USING (public.is_admin());

CREATE POLICY "Users can view own discount usage" ON public.used_discount_codes FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can insert own discount usage" ON public.used_discount_codes FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());
