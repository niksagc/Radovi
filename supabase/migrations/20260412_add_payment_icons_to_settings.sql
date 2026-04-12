-- Add icon URL columns to app_settings for custom payment logos
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS visa_icon_url TEXT;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS mastercard_icon_url TEXT;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS google_pay_icon_url TEXT;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS apple_pay_icon_url TEXT;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS keks_pay_icon_url TEXT;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS aircash_icon_url TEXT;
