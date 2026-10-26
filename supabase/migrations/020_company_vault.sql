-- Encrypted company vault (passwords, DUNS, addresses, etc.) — admin-only

CREATE TABLE IF NOT EXISTS invoice.company_vault_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (
    category IN ('password', 'server', 'company_id', 'address', 'other')
  ),
  ciphertext TEXT NOT NULL,
  iv TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT company_vault_title_not_empty CHECK (char_length(trim(title)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_company_vault_category
  ON invoice.company_vault_entries (category);

CREATE INDEX IF NOT EXISTS idx_company_vault_updated
  ON invoice.company_vault_entries (updated_at DESC);

ALTER TABLE invoice.company_vault_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_vault_admin_all"
  ON invoice.company_vault_entries
  FOR ALL
  USING (invoice.get_my_role() IN ('super_admin', 'admin'))
  WITH CHECK (invoice.get_my_role() IN ('super_admin', 'admin'));

CREATE OR REPLACE FUNCTION invoice.set_company_vault_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS company_vault_updated_at ON invoice.company_vault_entries;
CREATE TRIGGER company_vault_updated_at
  BEFORE UPDATE ON invoice.company_vault_entries
  FOR EACH ROW EXECUTE FUNCTION invoice.set_company_vault_updated_at();
