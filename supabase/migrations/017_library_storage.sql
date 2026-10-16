-- Private storage bucket for library files (PDF, Office)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'library',
  'library',
  false,
  52428800,
  ARRAY[
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "library_storage_insert_admin" ON storage.objects;
DROP POLICY IF EXISTS "library_storage_select_admin" ON storage.objects;
DROP POLICY IF EXISTS "library_storage_update_admin" ON storage.objects;
DROP POLICY IF EXISTS "library_storage_delete_admin" ON storage.objects;

CREATE POLICY "library_storage_insert_admin"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'library'
    AND EXISTS (
      SELECT 1 FROM invoice.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "library_storage_select_admin"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'library'
    AND EXISTS (
      SELECT 1 FROM invoice.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "library_storage_update_admin"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'library'
    AND EXISTS (
      SELECT 1 FROM invoice.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "library_storage_delete_admin"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'library'
    AND EXISTS (
      SELECT 1 FROM invoice.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'admin')
    )
  );
