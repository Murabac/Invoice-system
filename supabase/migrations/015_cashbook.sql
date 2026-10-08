-- Treasury cashbook: income and expense ledger per user

CREATE TABLE IF NOT EXISTS invoice.cashbook_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('income', 'expense')),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  category TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'invoice')),
  invoice_id UUID REFERENCES invoice.documents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cashbook_invoice_income_unique
  ON invoice.cashbook_entries (invoice_id)
  WHERE invoice_id IS NOT NULL AND entry_type = 'income';

CREATE INDEX IF NOT EXISTS idx_cashbook_user_date
  ON invoice.cashbook_entries (user_id, entry_date DESC);

ALTER TABLE invoice.cashbook_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoice_cashbook_select_own"
  ON invoice.cashbook_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "invoice_cashbook_insert_own"
  ON invoice.cashbook_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "invoice_cashbook_update_own"
  ON invoice.cashbook_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "invoice_cashbook_delete_own"
  ON invoice.cashbook_entries FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION invoice.set_cashbook_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cashbook_entries_updated_at ON invoice.cashbook_entries;
CREATE TRIGGER cashbook_entries_updated_at
  BEFORE UPDATE ON invoice.cashbook_entries
  FOR EACH ROW EXECUTE FUNCTION invoice.set_cashbook_updated_at();
