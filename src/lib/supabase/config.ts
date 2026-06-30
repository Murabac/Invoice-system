/** Postgres schema for this project (multi-schema Supabase setup). */
export const DB_SCHEMA = "invoice" as const;

export type DbSchema = typeof DB_SCHEMA;

export const supabaseClientOptions = {
  db: { schema: DB_SCHEMA },
} as const;
