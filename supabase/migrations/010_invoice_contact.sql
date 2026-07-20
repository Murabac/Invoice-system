-- Invoice contact details (footer)
ALTER TABLE invoice.profiles
  ADD COLUMN IF NOT EXISTS contact_name TEXT DEFAULT 'Mohamed';

ALTER TABLE invoice.profiles
  ADD COLUMN IF NOT EXISTS contact_phone_1 TEXT DEFAULT '4412241';

ALTER TABLE invoice.profiles
  ADD COLUMN IF NOT EXISTS contact_phone_2 TEXT DEFAULT '';
