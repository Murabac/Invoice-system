-- Shared company file library (folders + file metadata)

CREATE TABLE IF NOT EXISTS invoice.library_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES invoice.library_folders(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT library_folders_name_not_empty CHECK (char_length(trim(name)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS library_folders_unique_root_name
  ON invoice.library_folders (lower(trim(name)))
  WHERE parent_id IS NULL;

CREATE TABLE IF NOT EXISTS invoice.library_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID REFERENCES invoice.library_folders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_library_files_folder
  ON invoice.library_files (folder_id);

CREATE INDEX IF NOT EXISTS idx_library_files_created
  ON invoice.library_files (created_at DESC);

ALTER TABLE invoice.library_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice.library_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "library_folders_admin_all"
  ON invoice.library_folders
  FOR ALL
  USING (invoice.get_my_role() IN ('super_admin', 'admin'))
  WITH CHECK (invoice.get_my_role() IN ('super_admin', 'admin'));

CREATE POLICY "library_files_admin_all"
  ON invoice.library_files
  FOR ALL
  USING (invoice.get_my_role() IN ('super_admin', 'admin'))
  WITH CHECK (invoice.get_my_role() IN ('super_admin', 'admin'));

CREATE OR REPLACE FUNCTION invoice.set_library_file_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS library_files_updated_at ON invoice.library_files;
CREATE TRIGGER library_files_updated_at
  BEFORE UPDATE ON invoice.library_files
  FOR EACH ROW EXECUTE FUNCTION invoice.set_library_file_updated_at();
