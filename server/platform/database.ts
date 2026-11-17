import { createClient, SupabaseClient } from '@supabase/supabase-js';

/** Platform admin deliberately requires a private server credential. It never falls back to anon. */
const url = process.env.SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const platformDatabase: SupabaseClient | null =
  url.startsWith('https://') && serviceKey && !url.includes('your-project')
    ? createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;

