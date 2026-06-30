-- Add dashboard logo URL to profiles (sidebar branding, separate from invoice logo)
ALTER TABLE invoice.profiles
  ADD COLUMN IF NOT EXISTS dashboard_logo_url TEXT DEFAULT '/logo.jpeg';
