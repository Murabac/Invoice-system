-- Biloop Invoice System — Initial Schema (multi-schema setup)
-- Schema: invoice
-- Run in Supabase SQL Editor, then expose "invoice" under Project Settings → Data API → Exposed schemas

-- ---------------------------------------------------------------------------
-- Schema
-- ---------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS invoice;

GRANT USAGE ON SCHEMA invoice TO postgres, anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS invoice.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT DEFAULT 'Biloop Technology Innovators',
  logo_url TEXT DEFAULT '/logo.jpeg',
  website_url TEXT DEFAULT 'https://biloop.com',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Clients
CREATE TABLE IF NOT EXISTS invoice.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Documents (Quotations & Invoices)
CREATE TABLE IF NOT EXISTS invoice.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('quotation', 'invoice')),
  document_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'paid')),
  issue_date DATE,
  due_date DATE,
  client_id UUID REFERENCES invoice.clients(id) ON DELETE SET NULL,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tax NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  has_stamp BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, document_number)
);

-- Document line items
CREATE TABLE IF NOT EXISTS invoice.document_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES invoice.documents(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_invoice_clients_user_id ON invoice.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_documents_user_id ON invoice.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_documents_type ON invoice.documents(type);
CREATE INDEX IF NOT EXISTS idx_invoice_documents_status ON invoice.documents(status);
CREATE INDEX IF NOT EXISTS idx_invoice_document_items_document_id ON invoice.document_items(document_id);

-- ---------------------------------------------------------------------------
-- Functions & triggers
-- ---------------------------------------------------------------------------

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION invoice.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = invoice
AS $$
BEGIN
  INSERT INTO invoice.profiles (id, company_name, logo_url, website_url)
  VALUES (
    NEW.id,
    'Biloop Technology Innovators',
    '/logo.jpeg',
    'https://biloop.com'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS invoice_on_auth_user_created ON auth.users;
CREATE TRIGGER invoice_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION invoice.handle_new_user();

-- Updated_at trigger helper
CREATE OR REPLACE FUNCTION invoice.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON invoice.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON invoice.profiles
  FOR EACH ROW EXECUTE FUNCTION invoice.set_updated_at();

DROP TRIGGER IF EXISTS clients_updated_at ON invoice.clients;
CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON invoice.clients
  FOR EACH ROW EXECUTE FUNCTION invoice.set_updated_at();

DROP TRIGGER IF EXISTS documents_updated_at ON invoice.documents;
CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON invoice.documents
  FOR EACH ROW EXECUTE FUNCTION invoice.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE invoice.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice.document_items ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "invoice_profiles_select_own"
  ON invoice.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "invoice_profiles_update_own"
  ON invoice.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "invoice_profiles_insert_own"
  ON invoice.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Clients
CREATE POLICY "invoice_clients_select_own"
  ON invoice.clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "invoice_clients_insert_own"
  ON invoice.clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "invoice_clients_update_own"
  ON invoice.clients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "invoice_clients_delete_own"
  ON invoice.clients FOR DELETE
  USING (auth.uid() = user_id);

-- Documents
CREATE POLICY "invoice_documents_select_own"
  ON invoice.documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "invoice_documents_insert_own"
  ON invoice.documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "invoice_documents_update_own"
  ON invoice.documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "invoice_documents_delete_own"
  ON invoice.documents FOR DELETE
  USING (auth.uid() = user_id);

-- Document items (via document ownership)
CREATE POLICY "invoice_document_items_select_own"
  ON invoice.document_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invoice.documents d
      WHERE d.id = document_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "invoice_document_items_insert_own"
  ON invoice.document_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoice.documents d
      WHERE d.id = document_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "invoice_document_items_update_own"
  ON invoice.document_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM invoice.documents d
      WHERE d.id = document_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "invoice_document_items_delete_own"
  ON invoice.document_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM invoice.documents d
      WHERE d.id = document_id AND d.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Grants (required for Supabase Data API access)
-- ---------------------------------------------------------------------------
GRANT ALL ON ALL TABLES IN SCHEMA invoice TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA invoice TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA invoice TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA invoice
  GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA invoice
  GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA invoice
  GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Storage (optional — shared storage schema, project-specific bucket)
-- ---------------------------------------------------------------------------
-- INSERT INTO storage.buckets (id, name, public) VALUES ('invoice-logos', 'invoice-logos', true);
--
-- CREATE POLICY "invoice_logos_insert_own"
--   ON storage.objects FOR INSERT TO authenticated
--   WITH CHECK (bucket_id = 'invoice-logos' AND (storage.foldername(name))[1] = auth.uid()::text);
--
-- CREATE POLICY "invoice_logos_select_public"
--   ON storage.objects FOR SELECT TO public
--   USING (bucket_id = 'invoice-logos');
--
-- CREATE POLICY "invoice_logos_update_own"
--   ON storage.objects FOR UPDATE TO authenticated
--   USING (bucket_id = 'invoice-logos' AND (storage.foldername(name))[1] = auth.uid()::text);
--
-- CREATE POLICY "invoice_logos_delete_own"
--   ON storage.objects FOR DELETE TO authenticated
--   USING (bucket_id = 'invoice-logos' AND (storage.foldername(name))[1] = auth.uid()::text);
