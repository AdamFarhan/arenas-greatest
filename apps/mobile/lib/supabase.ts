import * as SecureStore from "expo-secure-store";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@riftbound/db";

const secureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key)
};

export function getMobileSupabase() {
  return createClient<Database>(
    process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      auth: {
        storage: secureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
      }
    }
  );
}

export function hasSupabaseConfig() {
  return Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
}

export function getAuthRedirectUrl() {
  return process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL ?? "riftboundtracker://";
}
