import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrate() {
  console.log('Starting migration: adding from_email and from_name to app_settings');
  
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS from_email TEXT;
      ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS from_name TEXT;
    `
  });

  if (error) {
    console.error('Migration failed (exec_sql might not exist):', error);
    // Fallback: try to just insert/update and see if it fails, 
    // but without exec_sql we can't easily run DDL via JS client.
  } else {
    console.log('Migration successful');
  }
}

migrate();
