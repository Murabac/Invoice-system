-- Harden new-user defaults: no implicit admin on public signup; M2B branding defaults

ALTER TABLE invoice.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE invoice.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('super_admin', 'admin', 'pending'));

CREATE OR REPLACE FUNCTION invoice.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = invoice
AS $$
DECLARE
  meta_role TEXT;
  assigned_role TEXT;
BEGIN
  meta_role := NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), '');
  IF meta_role IN ('super_admin', 'admin') THEN
    assigned_role := meta_role;
  ELSE
    assigned_role := 'pending';
  END IF;

  INSERT INTO invoice.profiles (
    id,
    company_name,
    logo_url,
    dashboard_logo_url,
    website_url,
    email,
    role,
    invoice_header_theme,
    invoice_stamp,
    dashboard_header_text,
    business_address_line1,
    business_address_line2,
    business_phone,
    contact_name,
    contact_phone_1,
    contact_phone_2,
    default_terms
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'M2B Technology'),
    '/logo-m2b.png',
    '/logo-m2b.png',
    'https://m2btek.com',
    NEW.email,
    assigned_role,
    'm2b',
    'm2b',
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'M2B Technology'),
    'Hargaisa, Somaliland',
    'Ibrahim Koodbur, Badacas',
    '(252) 63-4412241',
    'Mohamed',
    '4412241',
    '',
    '[
      "Customer will be billed 30% after indicating acceptance of this quote.",
      "Payment will be due prior to delivery of service and goods.",
      "Connecting today, building tomorrow."
    ]'::jsonb
  );
  RETURN NEW;
END;
$$;
