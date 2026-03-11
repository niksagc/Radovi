-- Allow admins to delete preorder contacts
CREATE POLICY "Admins can delete preorder contacts" ON public.preorder_contacts FOR DELETE USING (public.is_admin());
