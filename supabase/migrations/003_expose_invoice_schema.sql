-- Fix: "Invalid schema: invoice" / PGRST106
-- Run AFTER adding "invoice" in Supabase Dashboard → Project Settings → API → Exposed schemas
--
-- Steps:
--   1. Dashboard → Settings → API → Exposed schemas → add: invoice
--      (keep public, storage, graphql_public if already listed)
--   2. Run this entire script in the SQL Editor

-- Ensure schema exists and grants are applied (safe to re-run)
CREATE SCHEMA IF NOT EXISTS invoice;

GRANT USAGE ON SCHEMA invoice TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA invoice TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA invoice TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA invoice TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA invoice
  GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA invoice
  GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA invoice
  GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

-- Reload PostgREST so the API picks up the exposed schema
-- Option A (recommended): use dashboard exposed-schemas list
ALTER ROLE authenticator RESET pgrst.db_schemas;

-- Option B: if Option A does not work, uncomment and adjust the list to match your project:
-- ALTER ROLE authenticator SET pgrst.db_schemas = 'public, storage, graphql_public, invoice';

NOTIFY pgrst, 'reload config';
