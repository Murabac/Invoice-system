ALTER TABLE invoice.documents
  ADD COLUMN IF NOT EXISTS hide_client_name BOOLEAN NOT NULL DEFAULT false;
