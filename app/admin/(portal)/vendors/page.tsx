import { createClient } from "@/lib/supabase/server";
import { approveVendor, suspendVendor, updateVendorCommission } from "@/lib/actions/vendors";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function AdminVendorsPage() {
  const supabase = await createClient();
  const { data: vendors } = await supabase
    .from("vendors")
    .select("id, business_name, slug, is_approved, commission_pct, created_at")
    .order("created_at", { ascending: false });

  const all = vendors ?? [];

  return (
    <div>
      <h2 className="text-lg font-semibold text-neutral-900">Vendors</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Approve new vendors and adjust commission rates.
      </p>

      <div className="mt-4 space-y-3">
        {all.length === 0 ? (
          <p className="text-sm text-neutral-500">No vendors have registered yet.</p>
        ) : (
          all.map((vendor) => (
            <div
              key={vendor.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 p-4"
            >
              <div>
                <p className="font-medium text-neutral-900">{vendor.business_name}</p>
                <p className="text-xs text-neutral-400">/{vendor.slug}</p>
              </div>

              <Badge tone={vendor.is_approved ? "green" : "amber"}>
                {vendor.is_approved ? "Approved" : "Pending"}
              </Badge>

              <form action={updateVendorCommission} className="flex items-center gap-2">
                <input type="hidden" name="id" value={vendor.id} />
                <label className="text-sm text-neutral-600">
                  Commission %
                  <input
                    type="number"
                    name="commission-pct"
                    step="0.01"
                    min={0}
                    max={100}
                    defaultValue={vendor.commission_pct}
                    className="ml-2 w-20 rounded-lg border border-neutral-300 px-2 py-1 text-sm"
                  />
                </label>
                <button type="submit" className="text-sm text-neutral-600 underline hover:text-neutral-900">
                  Save
                </button>
              </form>

              {vendor.is_approved ? (
                <form action={suspendVendor}>
                  <input type="hidden" name="id" value={vendor.id} />
                  <Button type="submit" variant="secondary">
                    Suspend
                  </Button>
                </form>
              ) : (
                <form action={approveVendor}>
                  <input type="hidden" name="id" value={vendor.id} />
                  <Button type="submit">Approve</Button>
                </form>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
