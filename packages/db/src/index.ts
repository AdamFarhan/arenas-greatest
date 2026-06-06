import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export function createSupabaseClient(url: string, anonKey: string) {
  if (!url || !anonKey) {
    throw new Error("Supabase URL and anon key are required.");
  }

  return createClient<Database>(url, anonKey);
}

export type SupabaseClient = ReturnType<typeof createSupabaseClient>;
export type { Database };
