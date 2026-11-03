import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database";
import { supabaseClientOptions } from "@/lib/supabase/config";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export function createClient() {
  const { url, anonKey } = getSupabasePublicEnv();
  return createBrowserClient<Database>(
    url,
    anonKey,
    supabaseClientOptions
  );
}
