-- Dahabshiil (and any treasury-linked account) always mirrors cashbook current balance

ALTER TABLE invoice.accounts
  ADD COLUMN IF NOT EXISTS balance_source TEXT NOT NULL DEFAULT 'transactions';

ALTER TABLE invoice.accounts
  DROP CONSTRAINT IF EXISTS accounts_balance_source_check;

ALTER TABLE invoice.accounts
  ADD CONSTRAINT accounts_balance_source_check
  CHECK (balance_source IN ('transactions', 'treasury'));

UPDATE invoice.accounts
SET
  balance_source = 'treasury',
  notes = COALESCE(
    NULLIF(trim(notes), ''),
    'Always shows Treasury current balance (income − expenses)'
  )
WHERE lower(trim(name)) = 'dahabshiil account';
