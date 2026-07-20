-- Allow H24 Technology brand theme
ALTER TABLE invoice.profiles
  DROP CONSTRAINT IF EXISTS profiles_invoice_header_theme_check;

ALTER TABLE invoice.profiles
  ADD CONSTRAINT profiles_invoice_header_theme_check
  CHECK (invoice_header_theme IN ('blue', 'gradient', 'h24'));
