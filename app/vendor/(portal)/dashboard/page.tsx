import { createClient } from "@/lib/supabase/server";
import { getPendingPayoutSummary } from "@/lib/payouts/calculate";
import { currencyFormatter } from "@/lib/formatting";

export const dynamic = "force-dynamic";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 p-4">
      <p className="text-xs uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="mt-1 text-xl font-semibold text-neutral-900">{value}</p>
    </div>
  );
}

export default async function VendorDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: awaitingItems }, pendingPayout, { data: releasedItems }] = await Promise.all([
    supabase
      .from("order_items")
      .select("vendor_earning")
      .eq("vendor_id", user!.id)
      .eq("fulfillment_status", "awaiting_pickup"),
    getPendingPayoutSummary(supabase, user!.id),
    supabase
      .from("order_items")
      .select("vendor_earning")
      .eq("vendor_id", user!.id)
      .eq("fulfillment_status", "payout_released"),
  ]);

  const awaitingTotal = (awaitingItems ?? []).reduce((sum, i) => sum + i.vendor_earning, 0);
  const pickedUpTotal = pendingPayout[0]?.amount ?? 0;
  const paidOutTotal = (releasedItems ?? []).reduce((sum, i) => sum + i.vendor_earning, 0);

  return (
    <div>
      <h2 className="text-lg font-semibold text-neutral-900">Dashboard</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Awaiting Pickup" value={currencyFormatter.format(awaitingTotal)} />
        <StatCard label="Pending Payout" value={currencyFormatter.format(pickedUpTotal)} />
        <StatCard label="Paid Out" value={currencyFormatter.format(paidOutTotal)} />
      </div>
    </div>
  );
}
