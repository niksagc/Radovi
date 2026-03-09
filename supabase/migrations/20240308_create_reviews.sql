-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add unique constraint to prevent multiple reviews for the same order
ALTER TABLE public.reviews ADD CONSTRAINT unique_order_review UNIQUE (order_id);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Approved reviews are viewable by everyone" 
  ON public.reviews FOR SELECT 
  USING (is_approved = true);

CREATE POLICY "Users can view own reviews" 
  ON public.reviews FOR SELECT 
  USING (auth.uid() = student_id OR public.is_admin());

CREATE POLICY "Users can create reviews for own orders" 
  ON public.reviews FOR INSERT 
  WITH CHECK (
    auth.uid() = student_id AND 
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE id = order_id AND student_id = auth.uid() AND status = 'Završeno'
    )
  );

CREATE POLICY "Admins can update reviews" 
  ON public.reviews FOR UPDATE 
  USING (public.is_admin());

CREATE POLICY "Admins can delete reviews" 
  ON public.reviews FOR DELETE 
  USING (public.is_admin());

-- Indexes
CREATE INDEX idx_reviews_service_id ON public.reviews(service_id);
CREATE INDEX idx_reviews_order_id ON public.reviews(order_id);
CREATE INDEX idx_reviews_student_id ON public.reviews(student_id);

-- Trigger for updated_at
CREATE TRIGGER set_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
