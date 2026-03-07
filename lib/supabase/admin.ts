import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase env vars missing. Using mock admin client.');
    return {
      auth: {
        admin: {
          deleteUser: async () => ({ data: null, error: null }),
        }
      },
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: null }),
            order: async () => ({ data: [], error: null }),
            limit: async () => ({ data: [], error: null }),
          }),
          order: async () => ({ data: [], error: null }),
          single: async () => ({ data: null, error: null }),
          limit: async () => ({ data: [], error: null }),
          then: (resolve: any) => resolve({ data: [], error: null }),
        }),
        insert: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        update: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        delete: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
      }),
    } as any;
  }

  return createSupabaseClient(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
