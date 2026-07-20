import type { SupabaseClient } from "@supabase/supabase-js";

export type PendingPayoutEntry = { vendorId: string; itemIds: string[]; amount: number };

// order_items that have been picked up but not yet batched into a payout —
// this is intentionally a live query, not a table, since "owed to vendor"
// is always derivable from fulfillment_status/payout_id rather than tracked
// separately. Used by both the admin payouts page (no vendorId filter) and
// a vendor's own dashboard "pending earnings" figure (filtered to self).
export async function getPendingPayoutSummary(
  supabase: SupabaseClient,
  vendorId?: string
): Promise<PendingPayoutEntry[]> {
  const baseQuery = supabase
    .from("order_items")
    .select("id, vendor_id, vendor_earning")
    .eq("fulfillment_status", "picked_up")
    .is("payout_id", null);

  // Reassigning the builder via `let` after a conditional `.eq()` confuses
  // supabase-js's generic query-builder types (each method call narrows the
  // type in a way TS can't unify on reassignment) — branching the await
  // instead sidesteps it.
  const { data } = vendorId ? await baseQuery.eq("vendor_id", vendorId) : await baseQuery;
  const items = data ?? [];

  const byVendor = new Map<string, PendingPayoutEntry>();
  for (const item of items) {
    const entry: PendingPayoutEntry = byVendor.get(item.vendor_id) ?? {
      vendorId: item.vendor_id,
      itemIds: [],
      amount: 0,
    };
    entry.itemIds.push(item.id);
    entry.amount = Math.round((entry.amount + item.vendor_earning) * 100) / 100;
    byVendor.set(item.vendor_id, entry);
  }

  return [...byVendor.values()];
}
