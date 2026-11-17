import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env';

const supabaseUrl = env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export const isServerSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  !supabaseUrl.includes('your-project') &&
  supabaseUrl.startsWith('https://')
);

export let serverSupabase: SupabaseClient | null = isServerSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    })
  : null;

export const setServerSupabaseCredentials = (url: string, key: string): boolean => {
  if (url && key && url.startsWith('https://') && !url.includes('your-project')) {
    serverSupabase = createClient(url.trim(), key.trim(), {
      auth: { persistSession: false }
    });
    return true;
  }
  serverSupabase = null;
  return false;
};

export const testServerSupabase = async (): Promise<{ success: boolean; message: string }> => {
  if (!serverSupabase) {
    return { success: false, message: 'Supabase credentials are not configured on server.' };
  }
  try {
    const { error } = await serverSupabase.from('companies').select('count', { count: 'exact', head: true });
    if (error) {
      return { success: false, message: `Database error: ${error.message}. Ensure schema.sql is executed.` };
    }
    return { success: true, message: 'Server successfully connected to Supabase PostgreSQL cloud database!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Network error connecting to Supabase.' };
  }
};

