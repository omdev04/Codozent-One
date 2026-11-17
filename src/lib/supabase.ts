import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve credentials from environment or localStorage for runtime flexibility
export const getEnvOrStorage = (key: string): string => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(`factoryflow_${key}`);
    if (stored) return stored.trim();
  }
  return (((import.meta as any).env?.[key] as string) || '').trim();
};

export const getIsSupabaseConfigured = (): boolean => {
  const url = getEnvOrStorage('VITE_SUPABASE_URL');
  const key = getEnvOrStorage('VITE_SUPABASE_ANON_KEY');
  return Boolean(
    url &&
    key &&
    !url.includes('your-project') &&
    url.startsWith('https://')
  );
};

export let isSupabaseConfigured = getIsSupabaseConfigured();

const initSupabaseClient = (): SupabaseClient | null => {
  const url = getEnvOrStorage('VITE_SUPABASE_URL');
  const key = getEnvOrStorage('VITE_SUPABASE_ANON_KEY');
  if (url && key && !url.includes('your-project') && url.startsWith('https://')) {
    return createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      realtime: { params: { eventsPerSecond: 10 } }
    });
  }
  return null;
};

export let supabase: SupabaseClient | null = initSupabaseClient();

export const updateSupabaseCredentials = (url: string, key: string): boolean => {
  const cleanUrl = url.trim();
  const cleanKey = key.trim();

  if (typeof window !== 'undefined') {
    localStorage.setItem('factoryflow_VITE_SUPABASE_URL', cleanUrl);
    localStorage.setItem('factoryflow_VITE_SUPABASE_ANON_KEY', cleanKey);
  }

  if (cleanUrl && cleanKey && cleanUrl.startsWith('https://') && !cleanUrl.includes('your-project')) {
    supabase = createClient(cleanUrl, cleanKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    isSupabaseConfigured = true;
    return true;
  } else {
    supabase = null;
    isSupabaseConfigured = false;
    return false;
  }
};

export const clearSupabaseCredentials = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('factoryflow_VITE_SUPABASE_URL');
    localStorage.removeItem('factoryflow_VITE_SUPABASE_ANON_KEY');
  }
  supabase = null;
  isSupabaseConfigured = false;
};

export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  if (!supabase) {
    return {
      success: false,
      message: 'Supabase credentials are not configured or invalid. Please check URL and Anon key.'
    };
  }
  try {
    // Try pinging companies or auth health
    const { data, error } = await supabase.from('companies').select('count', { count: 'exact', head: true });
    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return {
          success: false,
          message: `Connected to Supabase, but tables are missing! Please run 'supabase/schema.sql' in your Supabase SQL Editor.`
        };
      }
      return {
        success: false,
        message: `Database connection error: ${error.message}`
      };
    }
    return {
      success: true,
      message: 'Connected successfully to live Supabase PostgreSQL database!'
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Network error connecting to Supabase.'
    };
  }
};
