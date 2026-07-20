-- products_select (and the matching product_images/product_variants
-- policies) checked vendor approval via a raw `exists (select 1 from
-- vendors ...)` subquery. Because that subquery runs as the querying role
-- (anon/authenticated), it's itself subject to vendors' own restrictive RLS
-- (`id = auth.uid() or is_admin()`) — so for anon/customer visitors the
-- subquery always came back empty, silently hiding every approved product
-- from the public storefront. Same root cause as the orders/order_items
-- recursion bug fixed in 0003: a cross-table RLS check needs to go through
-- a SECURITY DEFINER function, which bypasses RLS on the table it queries
-- internally, instead of a plain subquery.
create function is_vendor_approved(check_vendor_id uuid) returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from vendors where id = check_vendor_id and is_approved);
$$;

drop policy products_select on products;
create policy products_select on products for select
  using (
    (status = 'approved' and is_vendor_approved(vendor_id))
    or vendor_id = auth.uid()
    or is_admin()
  );

drop policy product_images_select on product_images;
create policy product_images_select on product_images for select
  using (
    exists (
      select 1 from products p
      where p.id = product_images.product_id
        and (
          p.vendor_id = auth.uid()
          or is_admin()
          or (p.status = 'approved' and is_vendor_approved(p.vendor_id))
        )
    )
  );

drop policy product_variants_select on product_variants;
create policy product_variants_select on product_variants for select
  using (
    exists (
      select 1 from products p
      where p.id = product_variants.product_id
        and (
          p.vendor_id = auth.uid()
          or is_admin()
          or (p.status = 'approved' and is_vendor_approved(p.vendor_id))
        )
    )
  );
