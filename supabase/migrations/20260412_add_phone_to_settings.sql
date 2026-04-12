-- Add phone field to app_settings for Keks Pay and Aircash
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS phone TEXT;
