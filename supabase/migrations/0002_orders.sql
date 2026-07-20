-- Orders, per-vendor order line items, payouts, and in-app notifications.

create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id),
  stripe_payment_intent_id text,
  total_amount numeric(10, 2) not null,
  currency text not null default 'usd',
  payment_status text not null check (payment_status in ('pending', 'paid', 'failed', 'refunded')) default 'pending',
  shipping_name text not null,
  shipping_address_line1 text not null,
  shipping_address_line2 text,
  shipping_city text not null,
  shipping_state text,
  shipping_postal_code text,
  shipping_country text not null,
  shipping_phone text,
  created_at timestamptz not null default now()
);

create table payouts (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id),
  status text not null check (status in ('pending', 'paid')) default 'pending',
  amount numeric(10, 2) not null,
  period_start timestamptz,
  period_end timestamptz,
  bank_reference text,
  paid_at timestamptz,
  recorded_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- fulfillment_status / picked_up_at / payout_id live on the line item, not on
-- `orders`, because one order can span multiple vendors whose pickup and
-- payout timing are entirely independent of each other. orders.payment_status
-- only ever tracks the Stripe-level charge for the whole cart.
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  vendor_id uuid not null references vendors(id),
  product_id uuid not null references products(id),
  variant_id uuid references product_variants(id),
  product_title_snapshot text not null,
  metal_type_snapshot text,
  unit_price numeric(10, 2) not null,
  quantity int not null default 1 check (quantity > 0),
  line_total numeric(10, 2) not null,
  commission_pct_snapshot numeric(5, 2) not null,
  commission_amount numeric(10, 2) not null,
  vendor_earning numeric(10, 2) not null,
  fulfillment_status text not null check (
    fulfillment_status in ('awaiting_pickup', 'picked_up', 'payout_released')
  ) default 'awaiting_pickup',
  picked_up_at timestamptz,
  picked_up_by uuid references profiles(id),
  payout_id uuid references payouts(id)
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles(id),
  type text not null check (type in ('new_order', 'product_approved', 'product_rejected', 'payout_sent')),
  title text not null,
  body text,
  link_href text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index orders_customer_id_idx on orders(customer_id);
create index orders_stripe_payment_intent_id_idx on orders(stripe_payment_intent_id);
create index order_items_order_id_idx on order_items(order_id);
create index order_items_vendor_id_idx on order_items(vendor_id);
create index order_items_fulfillment_status_idx on order_items(fulfillment_status);
create index payouts_vendor_id_idx on payouts(vendor_id);
create index notifications_recipient_id_idx on notifications(recipient_id, is_read);
