# Biloop Invoice Management System

Professional SaaS invoice and quotation management built with **Next.js 14**, **Tailwind CSS**, **TypeScript**, and **Supabase**.

## Features

- **Dashboard** — Total invoiced, pending quotations, issued/paid invoice counts
- **Unified documents list** — Filter quotations and invoices by type and status
- **Split-screen workspace** — Form on the left, live A4 document preview on the right
- **Quotation → Invoice conversion** — One-click convert with automatic stamp overlay
- **Print-ready canvas** — Company logo, client logo, line items, totals, signature line
- **Official stamp** — Circular "ORIGINAL ISSUED" overlay on issued invoices
- **Supabase Auth** — Secure multi-tenant data with Row Level Security

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Database & Auth | Supabase (PostgreSQL) |
| Icons | Lucide React |

## Brand Colors

- Primary: `#00A6FF` (Technology Blue)
- Accent Gold: `#FFC72C`
- Accent Maroon: `#7A0016`
- Background: `#F8F9FA`
- Cards: `#FFFFFF`

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Copy `.env.local.example` to `.env.local` and fill in your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

> **Multi-schema setup:** All tables live in the `invoice` schema. The app is configured via `src/lib/supabase/config.ts` (`DB_SCHEMA = "invoice"`).

### 3. Run the database migration

Open the Supabase SQL Editor and run the contents of:

```
supabase/migrations/001_initial_schema.sql
```

### 4. Expose the `invoice` schema (required — fixes "Invalid schema: invoice")

This app stores tables in the **`invoice`** schema, not `public`. Supabase must expose that schema to the REST API.

**Step A — Dashboard (required)**

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project  
2. Go to **Project Settings** → **Data API**  
3. Find **Exposed schemas**  
4. Add `invoice` to the list (keep existing entries like `public`, `storage`, `graphql_public`)  
5. Save

**Step B — SQL Editor (required)**

Run this file to reload the API:

```
supabase/migrations/003_expose_invoice_schema.sql
```

If you still see `Invalid schema: invoice`, uncomment **Option B** inside that file and run it again.

**Migration order**

1. `001_initial_schema.sql` — creates tables  
2. `003_expose_invoice_schema.sql` — exposes schema to API  
3. `002_storage_logos.sql` — logo uploads (optional)

### 5. Enable logo uploads (required for client logo upload)

Run in the Supabase SQL Editor:

```
supabase/migrations/002_storage_logos.sql
```

This creates the public `logos` bucket and RLS policies so each user can upload to `{user_id}/clients/...`.

### 6. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign up, and start creating documents.

## Project Structure

```
src/
├── app/
│   ├── dashboard/          # Metrics overview
│   ├── documents/          # List, new, edit routes
│   ├── login/ & signup/    # Auth pages
│   └── layout.tsx
├── components/
│   ├── auth/               # AuthForm
│   ├── documents/          # Canvas, Workspace, Table
│   ├── layout/             # Sidebar, Header, Shell
│   └── ui/                 # Button, Input, Select
└── lib/
    ├── actions/            # Server actions
    ├── supabase/           # Client, server, middleware
    ├── types/              # Database types
    └── utils/              # Formatting, calculations
public/
├── logo.jpeg               # Company logo
├── client.png              # Sample client logo
└── stamp.svg               # Official issued stamp
```

## Assets

Place your stamp image at `/public/stamp.png` to override the default SVG stamp. The app references `/stamp.svg` by default; rename or update `DocumentCanvas.tsx` if you use a PNG.

## License

Private — Biloop Technology Innovators
