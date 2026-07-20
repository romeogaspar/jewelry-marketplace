-- Core identity, categories, products, and variants.

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('customer', 'vendor', 'admin')) default 'customer',
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);

create table vendors (
  id uuid primary key references profiles(id) on delete cascade,
  business_name text not null,
  slug text not null unique,
  is_approved boolean not null default false,
  commission_pct numeric(5, 2) not null default 15.00,
  bank_account_name text,
  bank_account_number text,
  bank_name text,
  bank_iban text,
  address_line1 text,
  city text,
  country text,
  approved_at timestamptz,
  approved_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references categories(id),
  name text not null,
  slug text not null,
  level smallint not null check (level between 1 and 3),
  sort_order int not null default 0,
  is_active boolean not null default true,
  unique (parent_id, slug)
);

-- Enforce the 3-level-deep category tree: level is always parent.level + 1
-- (or 1 with no parent), and a level-3 category can never become a parent.
create function categories_set_level() returns trigger
language plpgsql as $$
declare
  parent_level smallint;
begin
  if new.parent_id is null then
    new.level := 1;
  else
    select level into parent_level from categories where id = new.parent_id;
    if parent_level is null then
      raise exception 'parent category % does not exist', new.parent_id;
    end if;
    if parent_level >= 3 then
      raise exception 'categories can only be nested 3 levels deep';
    end if;
    new.level := parent_level + 1;
  end if;
  return new;
end;
$$;

create trigger categories_set_level_trigger
  before insert or update of parent_id on categories
  for each row execute function categories_set_level();

create table products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  category_id uuid not null references categories(id),
  title text not null,
  slug text not null unique,
  description text,
  base_price numeric(10, 2) not null check (base_price >= 0),
  status text not null check (status in ('pending', 'approved', 'rejected', 'archived')) default 'pending',
  rejection_reason text,
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  stock int not null default 0 check (stock >= 0),
  primary_image_url text,
  created_at timestamptz not null default now()
);

-- Vendor-submitted products always start (and re-start, on any edit) in the
-- pending queue — a vendor can never set their own product live directly.
-- Admin approval flows through a separate update (see review actions), which
-- is allowed to set status because it runs through the service-role client.
-- Vendors (authenticated role) can edit their own product, but never its
-- status — only the service-role admin client (used by review actions) may
-- change it via UPDATE.
create function products_force_pending() returns trigger
language plpgsql as $$
begin
  if new.status is distinct from old.status and auth.role() = 'authenticated' then
    new.status := old.status;
  end if;
  return new;
end;
$$;

create function products_force_pending_on_insert() returns trigger
language plpgsql as $$
begin
  if auth.role() = 'authenticated' then
    new.status := 'pending';
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.rejection_reason := null;
  end if;
  return new;
end;
$$;

create trigger products_force_pending_insert_trigger
  before insert on products
  for each row execute function products_force_pending_on_insert();

create trigger products_force_pending_update_trigger
  before update on products
  for each row execute function products_force_pending();

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  sort_order int not null default 0
);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  metal_type text not null check (metal_type in ('white_gold', 'yellow_gold', 'rose_gold', 'silver')),
  swatch_hex text not null,
  price_delta numeric(10, 2) not null default 0,
  stock int not null default 0 check (stock >= 0),
  sku text,
  unique (product_id, metal_type)
);

create index products_vendor_id_idx on products(vendor_id);
create index products_category_id_idx on products(category_id);
create index products_status_idx on products(status);
create index product_variants_product_id_idx on product_variants(product_id);
create index product_images_product_id_idx on product_images(product_id);
create index categories_parent_id_idx on categories(parent_id);
