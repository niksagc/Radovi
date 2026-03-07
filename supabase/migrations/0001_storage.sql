-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('orders', 'orders', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('preorders', 'preorders', false) ON CONFLICT DO NOTHING;

-- Policies for 'orders' bucket
CREATE POLICY "Admin can do anything in orders" ON storage.objects FOR ALL USING (bucket_id = 'orders' AND public.is_admin());
CREATE POLICY "Students can upload to their order" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'orders' AND (auth.uid() = (SELECT student_id FROM public.orders WHERE id::text = (string_to_array(name, '/'))[1])));
CREATE POLICY "Students can read their order files" ON storage.objects FOR SELECT USING (bucket_id = 'orders' AND (auth.uid() = (SELECT student_id FROM public.orders WHERE id::text = (string_to_array(name, '/'))[1])));

-- Policies for 'preorders' bucket
CREATE POLICY "Admin can do anything in preorders" ON storage.objects FOR ALL USING (bucket_id = 'preorders' AND public.is_admin());
CREATE POLICY "Anyone can upload to preorders" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'preorders');
