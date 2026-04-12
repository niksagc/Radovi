-- Update orders status check constraint to match the application code
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status IN (
  'Nacrt', 
  'Čeka uplatu', 
  'Uplaćen depozit - U izradi', 
  'U izradi', 
  'Isporučeno', 
  'Čeka uplatu 2.dijela', 
  'Završeno', 
  'Otkazano zbog neplaćanja (2. dio)', 
  'Otkazano', 
  'Isteklo'
));
