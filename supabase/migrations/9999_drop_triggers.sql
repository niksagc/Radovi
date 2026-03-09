-- Aggressively drop ALL triggers on auth.users to prevent signup blocks
-- Using pg_trigger for maximum visibility
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tgname, relname 
        FROM pg_trigger 
        JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid 
        JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid 
        WHERE nspname = 'auth' AND relname = 'users'
    ) LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || r.tgname || ' ON auth.users CASCADE';
    END LOOP;
END $$;

-- Also drop specific known functions WITH CASCADE to remove dependent triggers
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.set_referral_code() CASCADE;
