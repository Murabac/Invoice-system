-- M2B Technology brand theme and stamp preset
ALTER TABLE invoice.profiles
  DROP CONSTRAINT IF EXISTS profiles_invoice_header_theme_check;

ALTER TABLE invoice.profiles
  ADD CONSTRAINT profiles_invoice_header_theme_check
  CHECK (invoice_header_theme IN ('blue', 'gradient', 'h24', 'm2b'));

ALTER TABLE invoice.profiles
  DROP CONSTRAINT IF EXISTS profiles_invoice_stamp_check;

ALTER TABLE invoice.profiles
  ADD CONSTRAINT profiles_invoice_stamp_check
  CHECK (invoice_stamp IN ('biloop', 'h24', 'm2b'));
