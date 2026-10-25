-- Company subscriptions & domain expiry registry (admin-only)

CREATE TABLE IF NOT EXISTS invoice.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('domain', 'saas', 'hosting', 'ssl', 'license', 'other')),
  vendor TEXT,
  expiry_date DATE NOT NULL,
  billing_cycle TEXT CHECK (billing_cycle IS NULL OR billing_cycle IN ('monthly', 'yearly', 'one_time', 'other')),
  renewal_amount NUMERIC(12, 2) CHECK (renewal_amount IS NULL OR renewal_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  auto_renew BOOLEAN NOT NULL DEFAULT false,
  website_url TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT subscriptions_name_not_empty CHECK (char_length(trim(name)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_expiry
  ON invoice.subscriptions (expiry_date ASC);

ALTER TABLE invoice.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_admin_all"
  ON invoice.subscriptions
  FOR ALL
  USING (invoice.get_my_role() IN ('super_admin', 'admin'))
  WITH CHECK (invoice.get_my_role() IN ('super_admin', 'admin'));

CREATE OR REPLACE FUNCTION invoice.set_subscription_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS subscriptions_updated_at ON invoice.subscriptions;
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON invoice.subscriptions
  FOR EACH ROW EXECUTE FUNCTION invoice.set_subscription_updated_at();
