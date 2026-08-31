import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export function createSupabaseServerClient() {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error("Supabase server client is not configured.");
  }

  return createClient(env.supabaseUrl, env.supabaseAnonKey);
}
