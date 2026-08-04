import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || (typeof process !== 'undefined' && process.env?.SUPABASE_URL) || 'https://xyzcompany.supabase.co';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

export const isSupabaseConfigured = Boolean(
  (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_URL && process.env?.SUPABASE_ANON_KEY)
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
