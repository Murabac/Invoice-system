-- Dashboard header text and invoice header color theme
ALTER TABLE invoice.profiles
  ADD COLUMN IF NOT EXISTS dashboard_header_text TEXT DEFAULT 'Biloop Technology Innovators';

ALTER TABLE invoice.profiles
  ADD COLUMN IF NOT EXISTS invoice_header_theme TEXT NOT NULL DEFAULT 'blue'
  CHECK (invoice_header_theme IN ('blue', 'gradient'));
