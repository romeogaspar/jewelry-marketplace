-- Row Level Security for every table, plus the SECURITY DEFINER helper
-- functions needed to avoid the classic orders <-> order_items RLS
-- recursion bug (each table's policy referencing the other directly causes
-- "infinite recursion detected in policy for relation" in Postgres — the fix,
-- confirmed against a sibling project that hit this exact issue, is to route
-- the cross-table lookup through a SECURITY DEFINER function, which bypasses
-- RLS on the table it queries internally and so never re-triggers the other
-- table's own policy).

create function is_admin() returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create function order_ids_for_vendor() returns setof uuid
language sql security definer set search_path = public stable as $$
  select order_id from order_items where vendor_id = auth.uid();
$$;

create function order_ids_for_customer() returns setof uuid
language sql security definer set search_path = public stable as $$
  select id from orders where customer_id = auth.uid();
$$;

-- Lock down columns that must only ever change via an admin (service-role)
-- action, never directly by the profile/vendor themselves, mirroring the
-- products_force_pending trigger already applied in 0001_init.sql.

create function profiles_lock_role() returns trigger
language plpgsql as $$
begin
  if new.role is distinct from old.role and auth.role() = 'authenticated' then
    new.role := old.role;
  end if;
  return new;
end;
$$;

create trigger profiles_lock_role_trigger
  before update on profiles
  for each row execute function profiles_lock_role();

create function vendors_force_unapproved_on_insert() returns trigger
language plpgsql as $$
begin
  if auth.role() = 'authenticated' then
    new.is_approved := false;
    new.approved_at := null;
    new.approved_by := null;
  end if;
  return new;
end;
$$;

create trigger vendors_force_unapproved_insert_trigger
  before insert on vendors
  for each row execute function vendors_force_unapproved_on_insert();

create function vendors_lock_admin_columns() returns trigger
language plpgsql as $$
begin
  if auth.role() = 'authenticated' then
    if new.is_approved is distinct from old.is_approved
      or new.commission_pct is distinct from old.commission_pct then
      new.is_approved := old.is_approved;
      new.commission_pct := old.commission_pct;
      new.approved_at := old.approved_at;
      new.approved_by := old.approved_by;
    end if;
  end if;
  return new;
end;
$$;

create trigger vendors_lock_admin_columns_trigger
  before update on vendors
  for each row execute function vendors_lock_admin_columns();

create function notifications_lock_content() returns trigger
language plpgsql as $$
begin
  if auth.role() = 'authenticated' then
    new.type := old.type;
    new.title := old.title;
    new.body := old.body;
    new.link_href := old.link_href;
    new.recipient_id := old.recipient_id;
  end if;
  return new;
end;
$$;

create trigger notifications_lock_content_trigger
  before update on notifications
  for each row execute function notifications_lock_content();

-- A public-safe view of vendor storefronts: only non-sensitive columns, only
-- approved vendors. Bank details / commission_pct never appear here. Views
-- run with the owning role's privileges by default (no RLS re-check against
-- the base table for this view's own definition), which is what lets this
-- stay public while the base `vendors` table itself stays locked down below.
create view vendors_public as
  select id, business_name, slug
  from vendors
  where is_approved;

grant select on vendors_public to anon, authenticated;

alter table profiles enable row level security;
alter table vendors enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table product_variants enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payouts enable row level security;
alter table notifications enable row level security;

create policy profiles_select on profiles for select
  using (id = auth.uid() or is_admin());

create policy profiles_insert on profiles for insert
  with check (id = auth.uid() and role in ('customer', 'vendor'));

create policy profiles_update on profiles for update
  using (id = auth.uid() or is_admin());

create policy vendors_select on vendors for select
  using (id = auth.uid() or is_admin());

create policy vendors_insert on vendors for insert
  with check (id = auth.uid());

create policy vendors_update on vendors for update
  using (id = auth.uid() or is_admin());

create policy categories_select on categories for select
  using (is_active or is_admin());

create policy categories_insert on categories for insert
  with check (is_admin());

create policy categories_update on categories for update
  using (is_admin());

create policy categories_delete on categories for delete
  using (is_admin());

create policy products_select on products for select
  using (
    (
      status = 'approved'
      and exists (select 1 from vendors v where v.id = products.vendor_id and v.is_approved)
    )
    or vendor_id = auth.uid()
    or is_admin()
  );

create policy products_insert on products for insert
  with check (vendor_id = auth.uid());

create policy products_update on products for update
  using (vendor_id = auth.uid() or is_admin());

create policy products_delete on products for delete
  using (is_admin());

create policy product_images_select on product_images for select
  using (
    exists (
      select 1 from products p
      where p.id = product_images.product_id
        and (
          p.vendor_id = auth.uid()
          or is_admin()
          or (p.status = 'approved' and exists (select 1 from vendors v where v.id = p.vendor_id and v.is_approved))
        )
    )
  );

create policy product_images_write on product_images for all
  using (exists (select 1 from products p where p.id = product_images.product_id and p.vendor_id = auth.uid()) or is_admin())
  with check (exists (select 1 from products p where p.id = product_images.product_id and p.vendor_id = auth.uid()) or is_admin());

create policy product_variants_select on product_variants for select
  using (
    exists (
      select 1 from products p
      where p.id = product_variants.product_id
        and (
          p.vendor_id = auth.uid()
          or is_admin()
          or (p.status = 'approved' and exists (select 1 from vendors v where v.id = p.vendor_id and v.is_approved))
        )
    )
  );

create policy product_variants_write on product_variants for all
  using (exists (select 1 from products p where p.id = product_variants.product_id and p.vendor_id = auth.uid()) or is_admin())
  with check (exists (select 1 from products p where p.id = product_variants.product_id and p.vendor_id = auth.uid()) or is_admin());

create policy orders_select on orders for select
  using (
    customer_id = auth.uid()
    or is_admin()
    or id in (select order_ids_for_vendor())
  );

create policy orders_insert on orders for insert
  with check (customer_id = auth.uid());

create policy order_items_select on order_items for select
  using (
    vendor_id = auth.uid()
    or is_admin()
    or order_id in (select order_ids_for_customer())
  );

create policy order_items_insert on order_items for insert
  with check (
    exists (select 1 from orders o where o.id = order_items.order_id and o.customer_id = auth.uid())
  );

create policy order_items_update on order_items for update
  using (is_admin());

create policy payouts_select on payouts for select
  using (vendor_id = auth.uid() or is_admin());

create policy payouts_write on payouts for all
  using (is_admin())
  with check (is_admin());

create policy notifications_select on notifications for select
  using (recipient_id = auth.uid());

create policy notifications_update on notifications for update
  using (recipient_id = auth.uid() or is_admin());

create policy notifications_insert on notifications for insert
  with check (is_admin());
