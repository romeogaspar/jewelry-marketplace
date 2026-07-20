import { createClient } from "@/lib/supabase/server";
import { getPendingPayoutSummary } from "@/lib/payouts/calculate";
import { createPayoutBatch, markPayoutPaid } from "@/lib/actions/payouts";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { currencyFormatter } from "@/lib/formatting";

export const dynamic = "force-dynamic";

export default async function AdminPayoutsPage() {
  const supabase = await createClient();

  const [pending, { data: vendors }, { data: payouts }] = await Promise.all([
    getPendingPayoutSummary(supabase),
    supabase.from("vendors").select("id, business_name"),
    supabase
      .from("payouts")
      .select("id, vendor_id, amount, status, bank_reference, created_at, vendors(business_name)")
      .order("created_at", { ascending: false }),
  ]);

  const vendorNameById = new Map((vendors ?? []).map((v) => [v.id, v.business_name]));

  return (
    <div>
      <h2 className="text-lg font-semibold text-neutral-900">Payouts</h2>

      <h3 className="mt-6 text-sm font-medium text-neutral-700">Ready to batch</h3>
      <div className="mt-2 space-y-2">
        {pending.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Nothing picked up and unbatched right now.
          </p>
        ) : (
          pending.map((entry) => (
            <div
              key={entry.vendorId}
              className="flex items-center justify-between rounded-lg border border-neutral-200 p-4"
            >
              <div>
                <p className="font-medium text-neutral-900">
                  {vendorNameById.get(entry.vendorId) ?? entry.vendorId}
                </p>
                <p className="text-xs text-neutral-500">
                  {entry.itemIds.length} item(s) &middot; {currencyFormatter.format(entry.amount)}
                </p>
              </div>
              <form action={createPayoutBatch}>
                <input type="hidden" name="vendor-id" value={entry.vendorId} />
                <Button type="submit">Create Payout Batch</Button>
              </form>
            </div>
          ))
        )}
      </div>

      <h3 className="mt-8 text-sm font-medium text-neutral-700">Payout batches</h3>
      <div className="mt-2 space-y-2">
        {(payouts ?? []).length === 0 ? (
          <p className="text-sm text-neutral-500">No payout batches yet.</p>
        ) : (
          (payouts ?? []).map((payout) => {
            const vendor = Array.isArray(payout.vendors) ? payout.vendors[0] : payout.vendors;
            return (
              <div
                key={payout.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 p-4"
              >
                <div>
                  <p className="font-medium text-neutral-900">
                    {vendor?.business_name} &middot; {currencyFormatter.format(payout.amount)}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {new Date(payout.created_at).toLocaleDateString()}
                    {payout.bank_reference ? ` · ref ${payout.bank_reference}` : ""}
                  </p>
                </div>

                {payout.status === "paid" ? (
                  <Badge tone="green">Paid</Badge>
                ) : (
                  <form action={markPayoutPaid} className="flex items-center gap-2">
                    <input type="hidden" name="payout-id" value={payout.id} />
                    <input
                      type="text"
                      name="bank-reference"
                      placeholder="Bank transfer reference"
                      required
                      className="rounded-lg border border-neutral-300 px-2 py-1 text-sm"
                    />
                    <Button type="submit">Mark Paid</Button>
                  </form>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
