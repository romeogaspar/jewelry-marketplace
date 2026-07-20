import { createClient } from "@/lib/supabase/server";
import { getPendingPayoutSummary } from "@/lib/payouts/calculate";
import Badge from "@/components/ui/Badge";
import { currencyFormatter } from "@/lib/formatting";

export const dynamic = "force-dynamic";

export default async function VendorPayoutsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [pending, { data: payouts }] = await Promise.all([
    getPendingPayoutSummary(supabase, user!.id),
    supabase
      .from("payouts")
      .select("id, amount, status, bank_reference, paid_at, created_at")
      .eq("vendor_id", user!.id)
      .order("created_at", { ascending: false }),
  ]);

  const pendingAmount = pending[0]?.amount ?? 0;

  return (
    <div>
      <h2 className="text-lg font-semibold text-neutral-900">Payouts</h2>

      <div className="mt-4 rounded-lg border border-neutral-200 p-4">
        <p className="text-xs uppercase tracking-wide text-neutral-400">
          Picked up, awaiting payout batch
        </p>
        <p className="text-xl font-semibold text-neutral-900">
          {currencyFormatter.format(pendingAmount)}
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {(payouts ?? []).length === 0 ? (
          <p className="text-sm text-neutral-500">No payout batches yet.</p>
        ) : (
          (payouts ?? []).map((payout) => (
            <div
              key={payout.id}
              className="flex items-center justify-between rounded-lg border border-neutral-200 p-4"
            >
              <div>
                <p className="font-medium text-neutral-900">
                  {currencyFormatter.format(payout.amount)}
                </p>
                <p className="text-xs text-neutral-500">
                  {new Date(payout.created_at).toLocaleDateString()}
                  {payout.bank_reference ? ` · ref ${payout.bank_reference}` : ""}
                </p>
              </div>
              <Badge tone={payout.status === "paid" ? "green" : "amber"}>
                {payout.status}
              </Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
