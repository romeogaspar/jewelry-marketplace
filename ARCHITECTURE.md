# Architecture

This started as a response to a real freelance brief for a multi-vendor
jewelry marketplace, whose budget didn't match the actual scope of a custom
build. Rather than pass on the idea entirely, it became a portfolio demo —
built to the same feature set, but with pragmatic substitutions where a real
client engagement would differ (Stripe test mode instead of a live regional
gateway, no real vendors). The decisions below are the ones worth explaining
to a technical reader, in rough order of "would come up in a client
conversation."

## Three sibling portals, not a role hierarchy

Customer (`/account`), vendor (`/vendor/*`), and admin (`/admin/*`) are
separate account spaces gated by a single `proxy.ts` (Next.js 16's
`middleware.ts` rename), enforced as **siblings, not a hierarchy** — an
admin session doesn't automatically pass the vendor gate, and vice versa.
Each portal has its own login. `profiles.role` is the single source of
truth; `proxy.ts` reads it and redirects on mismatch rather than 403ing
blindly, so a vendor who wanders into `/admin/*` lands somewhere sensible
instead of an error page.

Admin accounts are never self-registered. The only way one gets created is
`/admin/setup` — a public, unauthenticated page that checks
`auth.admin.listUsers()` server-side and **only renders the create-admin
form while zero admins exist**; the moment one does, it redirects to login.
That check is re-verified inside the server action too, not just trusted
from the page, so the endpoint can't be replayed as a backdoor.

## RLS: three real bugs, one recurring shape

Every cross-table Row Level Security check in this schema follows the same
failure mode if written naively: a policy on table A that does a plain
`exists (select 1 from B where ...)` is itself subject to B's own RLS for
whatever role is running the query — so if B is locked down, the subquery
silently returns nothing, even when A's own row is otherwise visible. This
showed up three separate times during the build:

1. **`orders` ↔ `order_items` infinite recursion** — each table's SELECT
   policy referenced the other directly, which Postgres detects and rejects
   outright (`infinite recursion detected in policy for relation`).
2. **Approved products invisible to anonymous visitors** — `products_select`
   checked vendor approval via a subquery into `vendors`, which is itself
   restricted to `id = auth.uid() or is_admin()`. For anon/customer traffic
   that subquery always came back empty, so the *product* row satisfied its
   own status check but the *vendor* check silently failed — no error, just
   an empty storefront.
3. **Checkout crashing on every attempt** — the same shape, but on the
   write path: the checkout server action needed `vendors.commission_pct`
   to compute the payout split, embedded via a join from `products`, which
   hit the identical restriction.

The fix in all three cases is the same: route the cross-table check through
a `SECURITY DEFINER` SQL function (`is_admin()`, `is_vendor_approved()`,
`order_ids_for_vendor()`, `order_ids_for_customer()`). A `SECURITY DEFINER`
function runs with the privileges of the function's owner, not the calling
role, so it bypasses RLS *on the table it queries internally* — breaking
the cycle — while the policy that calls it is still fully enforced for the
caller. Once you've hit this once, it's worth writing every RLS policy with
a cross-table dependency through this pattern from the start rather than a
raw subquery, which is exactly what the migrations do for orders/order_items
from `0003` onward.

The other place this pattern matters is `vendors_public` — a Postgres
**view**, not a policy, exposing only `id, business_name, slug` for approved
vendors. Views run with the owner's privileges by default, so it's the
public-safe read path for anything the storefront needs (vendor storefront
pages, "sold by" links) without ever exposing bank details or commission
rates to a browsing customer.

## Payments: gateway-agnostic by construction, not by promise

`lib/payments/provider.ts` defines the interface (`createPaymentIntent`,
`retrievePaymentStatus`, `verifyWebhookSignature`); `lib/payments/stripe.ts`
is the only file that imports the `stripe` SDK. Checkout and the webhook
handler depend only on the interface via `getPaymentProvider()`, keyed off
`PAYMENT_PROVIDER` in the environment. For a real UAE-based client this
would plug in a PayTabs or Telr adapter behind the same interface — the
call sites wouldn't change.

## Payouts are a one-way state machine, not a Connect integration

The brief was explicit: a vendor's payout must never release automatically
on payment — only once the operator has physically taken the item and
manually confirms the transfer. That rules out Stripe Connect's automatic
split-on-capture model entirely, so this uses **one Stripe account for the
whole platform** and tracks vendor earnings as plain bookkeeping:

```
order_items.fulfillment_status: awaiting_pickup → picked_up → payout_released
```

- The Stripe webhook only ever touches `orders.payment_status`. It never
  writes `fulfillment_status`.
- `awaiting_pickup → picked_up` happens once, from the admin order screen,
  and requires `payment_status = 'paid'` first.
- "Owed to vendor" (`lib/payouts/calculate.ts`) is a live query — `sum(vendor_earning) where fulfillment_status = 'picked_up' and payout_id is null` —
  not a stored balance, so it can't drift out of sync with the underlying
  order items.
- Batching (`createPayoutBatch`) groups picked-up items into a `payouts`
  row and stamps `payout_id` on them — this is bookkeeping, not payment;
  no money moves.
- Only `markPayoutPaid`, which requires a non-empty bank reference typed in
  by an admin, flips items to `payout_released`. There is no code path that
  calls a bank transfer API — this is deliberately a manual, audited step.

`commission_pct` and the resulting `commission_amount`/`vendor_earning` are
snapshotted onto each `order_item` at checkout time, not looked up live —
so changing a vendor's commission rate later never rewrites the economics
of past orders.

## Data model shape worth calling out

`fulfillment_status`, `picked_up_at`, and `payout_id` live on `order_items`
(the per-vendor line), not on `orders`. A single cart can span multiple
vendors, and each vendor's pickup/payout timeline is completely independent
of the others — one Stripe charge, one `orders` row, but each vendor only
ever sees and manages their own line items via `vendor_id = auth.uid()` in
RLS. `categories` is self-referencing with a trigger-enforced 3-level depth
cap (`categories_set_level`), which is what backs the
`/category/jewelry/lab-grown/earrings`-style nested URLs.

## What a real client build would add

- A real regional payment gateway (see above) instead of Stripe test mode.
- File upload for product photos (Supabase Storage) instead of pasted image
  URLs — a deliberate scope cut for the demo.
- Real email/SMS on the notification events (`notifications` already has
  the insert points; nothing downstream consumes them yet).
- A production-grade version of the "picked up" trust boundary — right now
  any admin can mark any paid item picked up with no additional evidence
  (photo, signature) that the operator actually has it in hand.
