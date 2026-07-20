-- Default terms and conditions for invoices and quotations
ALTER TABLE invoice.profiles
  ADD COLUMN IF NOT EXISTS default_terms JSONB NOT NULL DEFAULT '[
    "Customer will be billed 30% after indicating acceptance of this quote.",
    "Payment will be due prior to delivery of service and goods.",
    "The initial phase of the Project is scheduled to conclude within a duration of 21 days."
  ]'::jsonb;
