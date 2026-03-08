-- Add referral fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS credits_cents INT NOT NULL DEFAULT 0;

-- Add referral fields to orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS referral_code_used TEXT,
ADD COLUMN IF NOT EXISTS referral_discount_cents INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS credits_used_cents INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS referrer_rewarded BOOLEAN NOT NULL DEFAULT FALSE;

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_unique_referral_code(email TEXT) 
RETURNS TEXT AS $$
DECLARE
  base_code TEXT;
  new_code TEXT;
  counter INT := 0;
  exists_count INT;
BEGIN
  -- Base code: first 4 chars of email (or less) + random 4 digits
  base_code := lower(regexp_replace(split_part(email, '@', 1), '[^a-zA-Z0-9]', '', 'g'));
  IF length(base_code) > 4 THEN
    base_code := substring(base_code from 1 for 4);
  END IF;
  IF length(base_code) < 3 THEN
    base_code := 'user';
  END IF;
  
  LOOP
    new_code := base_code || floor(random() * 9000 + 1000)::text;
    SELECT count(*) INTO exists_count FROM public.profiles WHERE referral_code = new_code;
    IF exists_count = 0 THEN
      RETURN new_code;
    END IF;
    counter := counter + 1;
    IF counter > 100 THEN
       -- Fallback if too many collisions
       RETURN 'user' || floor(random() * 900000 + 100000)::text;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to assign referral code on insert
CREATE OR REPLACE FUNCTION set_referral_code() 
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_unique_referral_code(NEW.email);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS ensure_referral_code ON public.profiles;
CREATE TRIGGER ensure_referral_code
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION set_referral_code();

-- Backfill existing profiles
DO $$
DECLARE 
  r RECORD;
BEGIN
  FOR r IN SELECT id, email FROM public.profiles WHERE referral_code IS NULL LOOP
    UPDATE public.profiles 
    SET referral_code = generate_unique_referral_code(r.email)
    WHERE id = r.id;
  END LOOP;
END $$;
