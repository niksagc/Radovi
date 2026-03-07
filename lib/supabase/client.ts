import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase env vars missing. Using mock client.');
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        signInWithPassword: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        signUp: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        signOut: async () => ({ error: null }),
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

  return createBrowserClient(
    supabaseUrl,
    supabaseKey
  );
}
