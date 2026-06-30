-- User roles: super_admin (single account) and admin
ALTER TABLE invoice.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'admin'
  CHECK (role IN ('super_admin', 'admin'));

ALTER TABLE invoice.profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Backfill email from auth.users where missing
UPDATE invoice.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- Only one super_admin allowed
CREATE OR REPLACE FUNCTION invoice.enforce_single_super_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.role = 'super_admin' THEN
    IF EXISTS (
      SELECT 1
      FROM invoice.profiles
      WHERE role = 'super_admin'
        AND id IS DISTINCT FROM NEW.id
    ) THEN
      RAISE EXCEPTION 'Only one super admin is allowed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_single_super_admin ON invoice.profiles;
CREATE TRIGGER enforce_single_super_admin
  BEFORE INSERT OR UPDATE OF role ON invoice.profiles
  FOR EACH ROW EXECUTE FUNCTION invoice.enforce_single_super_admin();

-- Role helper (avoids recursive RLS)
CREATE OR REPLACE FUNCTION invoice.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = invoice
AS $$
  SELECT role FROM invoice.profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION invoice.get_my_role() TO authenticated;

-- Update profile trigger on signup / admin user create
CREATE OR REPLACE FUNCTION invoice.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = invoice
AS $$
BEGIN
  INSERT INTO invoice.profiles (id, company_name, logo_url, website_url, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'Biloop Technology Innovators'),
    '/logo.jpeg',
    'https://biloop.com',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'admin')
  );
  RETURN NEW;
END;
$$;

-- Super admin can read all profiles (for Users page)
DROP POLICY IF EXISTS "invoice_profiles_select_super_admin" ON invoice.profiles;
CREATE POLICY "invoice_profiles_select_super_admin"
  ON invoice.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR invoice.get_my_role() = 'super_admin'
  );

-- Drop old select policy (replaced by combined policy above)
DROP POLICY IF EXISTS "invoice_profiles_select_own" ON invoice.profiles;

-- Set your super admin after running (replace with your user id):
-- UPDATE invoice.profiles SET role = 'super_admin' WHERE email = 'you@example.com';
