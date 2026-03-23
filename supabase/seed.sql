-- Seed za demo korisnike
-- Napomena: Pokrenite ovo u SQL Editoru u Supabase kontrolnoj ploči.
-- Prije pokretanja, provjerite jesu li korisnici već kreirani u auth.users tablici.

DO $$
DECLARE
  admin_id UUID := uuid_generate_v4();
  student_id UUID := uuid_generate_v4();
BEGIN
  -- Admin
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
  VALUES (admin_id, 'nikola.duric2@skole.hr', crypt('lozinka123', gen_salt('bf')), NOW());
  
  INSERT INTO public.profiles (id, role, email, first_name, last_name)
  VALUES (admin_id, 'admin', 'nikola.duric2@skole.hr', 'Nikola', 'Đurić');

  -- Student
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
  VALUES (student_id, 'student@skola.hr', crypt('lozinka123', gen_salt('bf')), NOW());
  
  INSERT INTO public.profiles (id, role, email, first_name, last_name, username)
  VALUES (student_id, 'ucenik', 'student@skola.hr', 'Demo', 'Učenik', 'ukupac1');
END $$;
