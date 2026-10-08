-- One-time backfill: income entries for existing paid invoices (per user)
INSERT INTO invoice.cashbook_entries (
  user_id, entry_type, amount, entry_date, description, category, source, invoice_id
)
SELECT
  d.user_id,
  'income',
  d.grand_total,
  COALESCE(d.issue_date, CURRENT_DATE),
  'Invoice ' || d.document_number,
  'Sales',
  'invoice',
  d.id
FROM invoice.documents d
WHERE d.type = 'invoice'
  AND d.status = 'paid'
  AND NOT EXISTS (
    SELECT 1 FROM invoice.cashbook_entries c
    WHERE c.invoice_id = d.id AND c.entry_type = 'income'
  );
