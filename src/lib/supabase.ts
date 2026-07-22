import { createClient } from '@supabase/supabase-js';

const getEnvVar = (key: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] || '';
  }
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || getEnvVar('SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('SUPABASE_ANON_KEY');

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export function getSupabaseClient() {
  if (!supabase) {
    console.warn('Supabase client is not configured yet. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.');
  }
  return supabase;
}
