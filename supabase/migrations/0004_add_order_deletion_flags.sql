-- Add deletion flags to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS deleted_by_student BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS deleted_by_admin BOOLEAN NOT NULL DEFAULT FALSE;
