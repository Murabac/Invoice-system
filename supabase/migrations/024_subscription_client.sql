-- Link subscriptions to clients (required in app; nullable for legacy rows)

ALTER TABLE invoice.subscriptions
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES invoice.clients(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_subscriptions_client_id
  ON invoice.subscriptions (client_id);
