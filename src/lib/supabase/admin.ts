import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { supabaseClientOptions } from "@/lib/supabase/config";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY must be set for user management."
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    ...supabaseClientOptions,
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
