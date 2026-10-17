-- Link library files to source invoices (auto-archived PDFs)

ALTER TABLE invoice.library_files
  ADD COLUMN IF NOT EXISTS document_id UUID REFERENCES invoice.documents(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_library_files_document_unique
  ON invoice.library_files (document_id)
  WHERE document_id IS NOT NULL;
