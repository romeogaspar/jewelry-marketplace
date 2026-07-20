-- products_force_pending (0003) blocked ANY status change from an
-- authenticated (vendor) session, including the safe downgrade to 'pending'
-- that updateProduct relies on to re-queue an edited, already-approved
-- listing for review. Vendors still can never set status to 'approved' /
-- 'rejected' / 'archived' themselves — only 'pending' is allowed through.
create or replace function products_force_pending() returns trigger
language plpgsql as $$
begin
  if new.status is distinct from old.status
    and auth.role() = 'authenticated'
    and new.status is distinct from 'pending' then
    new.status := old.status;
  end if;
  return new;
end;
$$;
