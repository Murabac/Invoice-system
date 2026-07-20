-- Invoice stamp preset: biloop or h24
ALTER TABLE invoice.profiles
  ADD COLUMN IF NOT EXISTS invoice_stamp TEXT NOT NULL DEFAULT 'biloop'
  CHECK (invoice_stamp IN ('biloop', 'h24'));
