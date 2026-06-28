import { createClient } from '@supabase/supabase-js';
import type { Database } from '../domain/database.types';

const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};
const processEnv =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
const url = viteEnv.VITE_SUPABASE_URL ?? processEnv.VITE_SUPABASE_URL;
const anonKey = viteEnv.VITE_SUPABASE_ANON_KEY ?? processEnv.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Missing Supabase env vars. Copy .env.example to .env.local and fill in VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY.',
  );
}

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
