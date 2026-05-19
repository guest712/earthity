import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

function readSupabaseEnv(): { url: string; anonKey: string } | null {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, '') ?? '';
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

let client: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return readSupabaseEnv() != null;
}

export function getSupabase(): SupabaseClient {
  if (client) return client;
  const env = readSupabaseEnv();
  if (!env) {
    throw new Error('missing_supabase_env');
  }
  client = createClient(env.url, env.anonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    // Hermes release: dynamic import('@opentelemetry/api') in supabase-js ≥2.106 breaks hermesc
    tracePropagation: { enabled: false },
  });
  return client;
}
