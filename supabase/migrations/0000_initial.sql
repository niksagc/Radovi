-- Initial schema for StudyWorks

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  username TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User settings
CREATE TABLE public.user_settings (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- App settings (singleton)
CREATE TABLE public.app_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  notification_emails TEXT[] NOT NULL DEFAULT '{}',
  iban_recipient TEXT,
  iban_number TEXT,
  iban_bank TEXT,
  final_payment_deadline_hours INT NOT NULL DEFAULT 48,
  cancellation_days INT NOT NULL DEFAULT 14,
  preview_mode TEXT NOT NULL DEFAULT 'watermark' CHECK (preview_mode IN ('watermark', 'limited_pages')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Items (Services & Add-ons)
CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  price_cents INT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  type TEXT NOT NULL CHECK (type IN ('base', 'addon')),
  max_pages INT,
  max_slides INT,
  included_revisions INT NOT NULL DEFAULT 0,
  delivery_days INT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pre-order contacts
CREATE TABLE public.preorder_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  deadline TIMESTAMPTZ,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'replied', 'converted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Nacrt' CHECK (status IN (
    'Nacrt', 
    'Čeka uplatu', 
    'Depozit plaćen', 
    'U izradi', 
    'Isporučeno', 
    'Čeka potvrdu naplate (2. dio)', 
    'Završeno', 
    'Otkazano zbog neplaćanja (2. dio)', 
    'Otkazano', 
    'Isteklo'
  )),
  
  -- Cover fields
  school_name TEXT,
  topic TEXT,
  subject TEXT,
  mentor_name TEXT,
  student_name TEXT,
  class_name TEXT,
  city_date TEXT,
  
  -- Instructions
  instructions TEXT,
  deadline TIMESTAMPTZ,
  
  -- Revisions
  revisions_included INT NOT NULL DEFAULT 0,
  revisions_used INT NOT NULL DEFAULT 0,
  
  -- Totals
  subtotal_cents INT NOT NULL DEFAULT 0,
  addons_total_cents INT NOT NULL DEFAULT 0,
  total_cents INT NOT NULL DEFAULT 0,
  
  -- Split fields
  payment_model TEXT NOT NULL DEFAULT '100%' CHECK (payment_model IN ('100%', '50-50')),
  deposit_cents INT NOT NULL DEFAULT 0,
  final_cents INT NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order Items
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  price_cents INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order Add-ons
CREATE TABLE public.order_addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  price_cents INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('card', 'iban')),
  stage TEXT NOT NULL CHECK (stage IN ('deposit', 'final', 'full')),
  amount_cents INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'requires_action')),
  stripe_payment_intent_id TEXT,
  stripe_customer_id TEXT,
  stripe_payment_method_id TEXT,
  iban_proof_url TEXT,
  confirmed_by_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order Messages
CREATE TABLE public.order_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Files
CREATE TABLE public.files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  preorder_contact_id UUID REFERENCES public.preorder_contacts(id) ON DELETE CASCADE,
  uploader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN ('client_upload', 'school_instructions', 'deliverable', 'preorder', 'message_attachment')),
  path TEXT NOT NULL,
  filename TEXT NOT NULL,
  size_bytes INT NOT NULL,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security (RLS)

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preorder_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Helper functions for RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Users can read/update their own profile. Admins can do everything.
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE USING (public.is_admin());

-- User Settings
CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- App Settings: Anyone can read (needed for IBAN info during checkout), only admins can update.
CREATE POLICY "Anyone can read app settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update app settings" ON public.app_settings FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can insert app settings" ON public.app_settings FOR INSERT WITH CHECK (public.is_admin());

-- Categories: Anyone can read, admins can modify.
CREATE POLICY "Anyone can read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can insert categories" ON public.categories FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update categories" ON public.categories FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE USING (public.is_admin());

-- Items: Anyone can read active items, admins can read/modify all.
CREATE POLICY "Anyone can read active items" ON public.items FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Admins can insert items" ON public.items FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update items" ON public.items FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete items" ON public.items FOR DELETE USING (public.is_admin());

-- Pre-order contacts: Public can insert, only admins can read/update.
CREATE POLICY "Public can insert preorder contacts" ON public.preorder_contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can read preorder contacts" ON public.preorder_contacts FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update preorder contacts" ON public.preorder_contacts FOR UPDATE USING (public.is_admin());

-- Orders: Students can read/update their own, admins can do everything.
CREATE POLICY "Students can view own orders" ON public.orders FOR SELECT USING (auth.uid() = student_id OR public.is_admin());
CREATE POLICY "Students can insert own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = student_id OR public.is_admin());
CREATE POLICY "Students can update own orders" ON public.orders FOR UPDATE USING (auth.uid() = student_id OR public.is_admin());
CREATE POLICY "Admins can delete orders" ON public.orders FOR DELETE USING (public.is_admin());

-- Order Items & Addons
CREATE POLICY "Students can view own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND student_id = auth.uid()) OR public.is_admin()
);
CREATE POLICY "Students can insert own order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND student_id = auth.uid()) OR public.is_admin()
);
CREATE POLICY "Students can view own order addons" ON public.order_addons FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_addons.order_id AND student_id = auth.uid()) OR public.is_admin()
);
CREATE POLICY "Students can insert own order addons" ON public.order_addons FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_addons.order_id AND student_id = auth.uid()) OR public.is_admin()
);

-- Payments
CREATE POLICY "Students can view own payments" ON public.payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = payments.order_id AND student_id = auth.uid()) OR public.is_admin()
);
CREATE POLICY "Students can insert own payments" ON public.payments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = payments.order_id AND student_id = auth.uid()) OR public.is_admin()
);
CREATE POLICY "Students can update own payments" ON public.payments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = payments.order_id AND student_id = auth.uid()) OR public.is_admin()
);

-- Order Messages
CREATE POLICY "Students can view own order messages" ON public.order_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_messages.order_id AND student_id = auth.uid()) OR public.is_admin()
);
CREATE POLICY "Students can insert own order messages" ON public.order_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_messages.order_id AND student_id = auth.uid()) OR public.is_admin()
);

-- Files
CREATE POLICY "Students can view own files" ON public.files FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = files.order_id AND student_id = auth.uid()) OR public.is_admin()
);
CREATE POLICY "Students can insert own files" ON public.files FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = files.order_id AND student_id = auth.uid()) OR public.is_admin()
);
CREATE POLICY "Admins can update files" ON public.files FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete files" ON public.files FOR DELETE USING (public.is_admin());

-- Storage Policies (Requires creating buckets 'orders' and 'preorders')
-- We assume the buckets are created via the Supabase Dashboard or another script.
-- Policies for 'orders' bucket:
-- CREATE POLICY "Students can upload to their order" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'orders' AND (auth.uid() = (SELECT student_id FROM public.orders WHERE id::text = (string_to_array(name, '/'))[1]) OR public.is_admin()));
-- CREATE POLICY "Students can read their order files" ON storage.objects FOR SELECT USING (bucket_id = 'orders' AND (auth.uid() = (SELECT student_id FROM public.orders WHERE id::text = (string_to_array(name, '/'))[1]) OR public.is_admin()));

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_app_settings_updated_at BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_items_updated_at BEFORE UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, username, email)
  VALUES (NEW.id, 'student', NEW.email, NEW.email);
  
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
