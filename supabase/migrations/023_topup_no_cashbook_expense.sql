-- ONE-TIME cleanup: remove duplicate treasury expenses that were created by
-- earlier account top-ups when those amounts were already recorded as expenses.
-- Future top-ups still create a treasury expense via the app (correct flow).

ALTER TABLE invoice.account_transactions
  DROP CONSTRAINT IF EXISTS account_transactions_top_up_has_cashbook;

ALTER TABLE invoice.account_transactions
  DROP CONSTRAINT IF EXISTS account_transactions_cashbook_entry_id_fkey;

ALTER TABLE invoice.account_transactions
  ADD CONSTRAINT account_transactions_cashbook_entry_id_fkey
  FOREIGN KEY (cashbook_entry_id)
  REFERENCES invoice.cashbook_entries(id)
  ON DELETE SET NULL;

-- Unlink and delete only the cashbook rows that were auto-created by top-ups
DO $$
DECLARE
  linked_ids UUID[];
BEGIN
  SELECT array_agg(cashbook_entry_id)
  INTO linked_ids
  FROM invoice.account_transactions
  WHERE cashbook_entry_id IS NOT NULL;

  UPDATE invoice.account_transactions
  SET cashbook_entry_id = NULL
  WHERE cashbook_entry_id IS NOT NULL;

  IF linked_ids IS NOT NULL THEN
    DELETE FROM invoice.cashbook_entries
    WHERE id = ANY(linked_ids);
  END IF;
END $$;
