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

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    { count: pendingProducts },
    { count: pendingVendors },
    { data: paidOrders },
    pendingPayouts,
  ] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("vendors").select("id", { count: "exact", head: true }).eq("is_approved", false),
    supabase.from("orders").select("total_amount").eq("payment_status", "paid"),
    getPendingPayoutSummary(supabase),
  ]);

  const totalRevenue = (paidOrders ?? []).reduce((sum, o) => sum + o.total_amount, 0);
  const pendingPayoutTotal = pendingPayouts.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      <h2 className="text-lg font-semibold text-neutral-900">Dashboard</h2>
      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Pending Products" value={String(pendingProducts ?? 0)} />
        <StatCard label="Pending Vendors" value={String(pendingVendors ?? 0)} />
        <StatCard label="Total Revenue" value={currencyFormatter.format(totalRevenue)} />
        <StatCard label="Payouts Owed" value={currencyFormatter.format(pendingPayoutTotal)} />
      </div>
    </div>
  );
}
