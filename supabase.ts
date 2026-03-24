import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

console.log("LOADING SUPABASE MODULE");

let supabase: SupabaseClient | null = null;

const webStorage = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  },
};

export function getSupabase() {
  if (!supabase) {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

    console.log("CREATING SUPABASE SINGLETON");
    console.log("URL AT CREATION:", supabaseUrl);
    console.log("ANON AT CREATION:", supabaseAnonKey?.slice(0, 20));

    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: Platform.OS === 'web' ? webStorage : AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
    });

    supabase.auth.getSession().then(({ data }) => {
      console.log("Restored session:", data.session?.access_token);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", session?.access_token);
    });
  }

  return supabase;
}

export default getSupabase();