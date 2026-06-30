-- Supabase Storage: logos bucket for company & client logos
-- Run in Supabase SQL Editor after 001_initial_schema.sql

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "logos_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "logos_select_public" ON storage.objects;
DROP POLICY IF EXISTS "logos_update_own" ON storage.objects;
DROP POLICY IF EXISTS "logos_delete_own" ON storage.objects;

-- Authenticated users upload into their own folder: {user_id}/...
CREATE POLICY "logos_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "logos_select_public"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'logos');

CREATE POLICY "logos_update_own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "logos_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
