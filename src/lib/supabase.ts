import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve credentials from environment or localStorage for runtime flexibility
const getEnvOrStorage = (key: string): string => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(`factoryflow_${key}`);
    if (stored) return stored;
  }
  return ((import.meta as any).env?.[key] as string) || '';
};

const supabaseUrl = getEnvOrStorage('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvOrStorage('VITE_SUPABASE_ANON_KEY');

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project') &&
  supabaseUrl.startsWith('https://')
);

export let supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true },
      realtime: { params: { eventsPerSecond: 10 } }
    })
  : null;

export const updateSupabaseCredentials = (url: string, key: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('factoryflow_VITE_SUPABASE_URL', url.trim());
    localStorage.setItem('factoryflow_VITE_SUPABASE_ANON_KEY', key.trim());
    
    if (url.trim() && key.trim() && url.trim().startsWith('https://')) {
      supabase = createClient(url.trim(), key.trim());
      return true;
    }
  }
  return false;
};

export const clearSupabaseCredentials = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('factoryflow_VITE_SUPABASE_URL');
    localStorage.removeItem('factoryflow_VITE_SUPABASE_ANON_KEY');
    supabase = null;
  }
};

export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  if (!supabase) {
    return { success: false, message: 'Supabase credentials are not configured.' };
  }
  try {
    const { error } = await supabase.from('companies').select('count', { count: 'exact', head: true });
    if (error) {
      return { success: false, message: `Database error: ${error.message}. Please ensure the schema.sql is executed in your Supabase SQL editor.` };
    }
    return { success: true, message: 'Connected successfully to Supabase PostgreSQL database!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Network error connecting to Supabase.' };
  }
};
