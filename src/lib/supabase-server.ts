import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseServerClient: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient | null {
  if (!supabaseServerClient) {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      supabaseServerClient = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false }
      });
    }
  }
  return supabaseServerClient;
}
