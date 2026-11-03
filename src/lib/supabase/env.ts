/** Shared Supabase public env — must be set at Docker build time for NEXT_PUBLIC_*. */

export function getSupabasePublicEnv(): {
  url: string;
  anonKey: string;
} {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. In Coolify, set both as Build-time variables (and Runtime), then rebuild."
    );
  }

  return { url, anonKey };
}
