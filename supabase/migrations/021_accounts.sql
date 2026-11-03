-- Prepaid company accounts (cards / wallets) with top-up + spend ledger

CREATE TABLE IF NOT EXISTS invoice.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT accounts_name_not_empty CHECK (char_length(trim(name)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_name_lower
  ON invoice.accounts (lower(trim(name)));

CREATE TABLE IF NOT EXISTS invoice.account_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES invoice.accounts(id) ON DELETE RESTRICT,
  txn_type TEXT NOT NULL CHECK (txn_type IN ('top_up', 'spend')),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  txn_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  cashbook_entry_id UUID REFERENCES invoice.cashbook_entries(id) ON DELETE RESTRICT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT account_transactions_description_not_empty
    CHECK (char_length(trim(description)) > 0),
  CONSTRAINT account_transactions_top_up_has_cashbook
    CHECK (
      (txn_type = 'top_up' AND cashbook_entry_id IS NOT NULL)
      OR (txn_type = 'spend' AND cashbook_entry_id IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_account_transactions_account_date
  ON invoice.account_transactions (account_id, txn_date DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_account_transactions_cashbook
  ON invoice.account_transactions (cashbook_entry_id)
  WHERE cashbook_entry_id IS NOT NULL;

ALTER TABLE invoice.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice.account_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accounts_admin_all"
  ON invoice.accounts
  FOR ALL
  USING (invoice.get_my_role() IN ('super_admin', 'admin'))
  WITH CHECK (invoice.get_my_role() IN ('super_admin', 'admin'));

CREATE POLICY "account_transactions_admin_all"
  ON invoice.account_transactions
  FOR ALL
  USING (invoice.get_my_role() IN ('super_admin', 'admin'))
  WITH CHECK (invoice.get_my_role() IN ('super_admin', 'admin'));

CREATE OR REPLACE FUNCTION invoice.set_accounts_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS accounts_updated_at ON invoice.accounts;
CREATE TRIGGER accounts_updated_at
  BEFORE UPDATE ON invoice.accounts
  FOR EACH ROW EXECUTE FUNCTION invoice.set_accounts_updated_at();

-- Seed company prepaid accounts when at least one auth user exists
DO $$
DECLARE
  seed_user UUID;
BEGIN
  SELECT id INTO seed_user
  FROM auth.users
  ORDER BY created_at ASC
  LIMIT 1;

  IF seed_user IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO invoice.accounts (name, created_by)
  SELECT v.name, seed_user
  FROM (VALUES
    ('Dahabshiil Account'),
    ('Premier Mastercard')
  ) AS v(name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM invoice.accounts a
    WHERE lower(trim(a.name)) = lower(trim(v.name))
  );
END $$;
