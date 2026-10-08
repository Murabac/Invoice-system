# Live Supabase cleanup (M2B only)

Run these steps on the **production** Supabase project after deploying migration `014_auth_signup_role.sql`.

## 1. Disable public sign-ups (Dashboard)

1. Supabase Dashboard → **Authentication** → **Providers** → **Email**
2. Turn **off** “Enable sign-ups” (allow only invited/admin-created users)

## 2. Delete junk auth users

Use **Authentication → Users** or the Admin API. Remove accounts matching:

- `rsy.%@hotmail.com` (spam pattern)
- Any other emails you do not recognize

**Keep (unless you decide otherwise):**

- `admin@gmail.com` (super admin)
- `info@m2btek.com` (admin)

Deleting a user removes their `invoice.profiles` row and cascaded data (`clients`, `documents`, etc.) for that user.

### Optional: Node script (service role required)

From project root with `.env.local` containing `SUPABASE_SERVICE_ROLE_KEY`:

```bash
node scripts/delete-junk-users.mjs
```

Review output before confirming deletes (script lists candidates first).

## 3. Normalize remaining profiles to M2B

Run in **SQL Editor** (adjust emails if needed):

```sql
UPDATE invoice.profiles
SET
  company_name = 'M2B Technology',
  dashboard_header_text = 'M2B Technology',
  invoice_header_theme = 'm2b',
  invoice_stamp = 'm2b',
  logo_url = '/logo-m2b.png',
  dashboard_logo_url = '/logo-m2b.png',
  business_address_line1 = 'Hargaisa, Somaliland',
  business_address_line2 = 'Ibrahim Koodbur, Badacas',
  business_phone = '(252) 63-4412241',
  contact_name = 'Mohamed',
  contact_phone_1 = '4412241',
  contact_phone_2 = '',
  default_terms = '[
    "Customer will be billed 30% after indicating acceptance of this quote.",
    "Payment will be due prior to delivery of service and goods.",
    "Connecting today, building tomorrow."
  ]'::jsonb
WHERE email IN ('admin@gmail.com', 'info@m2btek.com');

UPDATE invoice.profiles
SET role = 'super_admin'
WHERE email = 'admin@gmail.com';

UPDATE invoice.profiles
SET role = 'admin'
WHERE email = 'info@m2btek.com';
```

## 4. Apply new migrations

Run in order:

- `supabase/migrations/014_auth_signup_role.sql`
- `supabase/migrations/015_cashbook.sql`

## 5. Backfill cashbook from paid invoices (optional)

After deploy, super admin can run once in SQL Editor:

```sql
INSERT INTO invoice.cashbook_entries (
  user_id, entry_type, amount, entry_date, description, source, invoice_id
)
SELECT
  d.user_id,
  'income',
  d.grand_total,
  COALESCE(d.issue_date, CURRENT_DATE),
  'Invoice ' || d.document_number,
  'invoice',
  d.id
FROM invoice.documents d
WHERE d.type = 'invoice'
  AND d.status = 'paid'
  AND NOT EXISTS (
    SELECT 1 FROM invoice.cashbook_entries c
    WHERE c.invoice_id = d.id AND c.entry_type = 'income'
  );
```
