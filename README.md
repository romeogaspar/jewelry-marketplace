# Jewelry Marketplace by Cessyrona Software Studio — Multi-Vendor Marketplace (Demo)

A custom-built, multi-vendor jewelry marketplace: customer storefront, vendor
portal with admin-gated product approval, Stripe checkout, and a manual
pickup → payout workflow. Built as a portfolio demo — see
[ARCHITECTURE.md](./ARCHITECTURE.md) for the design decisions behind it.

## Stack

Next.js 16 (App Router, TypeScript) · Supabase (Postgres, Auth, RLS) · Stripe
(test mode, behind a swappable payment-provider interface) · Tailwind CSS ·
`@react-pdf/renderer` for shipping labels.

## Local setup

1. `npm install`
2. Copy `.env.local.example` to `.env.local` and fill in a Supabase project's
   URL/anon/service-role keys, plus Stripe test-mode keys.
3. Push the schema: `supabase link --project-ref <ref>` then `supabase db push`.
4. `npm run seed` — creates a 3-level category tree, two approved vendors
   with a 9-product catalog, and one test customer. Does **not** create an
   admin account; bootstrap one live at `/admin/setup` (only works once, on
   an empty `auth.users` table).
5. `npm run dev`, then for Stripe webhooks locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
   (or whatever port `dev` runs on) and put the printed `whsec_...` into
   `STRIPE_WEBHOOK_SECRET`.

### Demo accounts (after seeding + bootstrapping an admin)

| Role | Email | Password |
|---|---|---|
| Vendor | `vendor@aurum.demo` | `DemoVendor123!` |
| Vendor | `vendor@solstice.demo` | `DemoVendor123!` |
| Customer | `customer@shopper.demo` | `DemoShopper123!` |
| Admin | *(whatever you set at `/admin/setup`)* | — |
# jewelry-marketplace
