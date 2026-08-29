-- Business location shown on invoice header
ALTER TABLE invoice.profiles
  ADD COLUMN IF NOT EXISTS business_address_line1 TEXT DEFAULT 'Hargaisa. Somaliland';

ALTER TABLE invoice.profiles
  ADD COLUMN IF NOT EXISTS business_address_line2 TEXT DEFAULT 'Ibrahim Koodbur, Badacas';

ALTER TABLE invoice.profiles
  ADD COLUMN IF NOT EXISTS business_phone TEXT DEFAULT '(252) 63-4412241';
