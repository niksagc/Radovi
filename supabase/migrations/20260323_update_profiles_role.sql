-- Ažuriranje ograničenja za ulogu
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('ucenik', 'admin'));

-- Osiguravanje RLS-a
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Politike
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());
