import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Badge from "@/components/ui/Badge";
import { currencyFormatter } from "@/lib/formatting";

export const dynamic = "force-dynamic";

const STATUS_TONE = {
  awaiting_pickup: "amber",
  picked_up: "blue",
  payout_released: "green",
} as const;

export default async function VendorOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: items } = await supabase
    .from("order_items")
    .select(
      "id, product_title_snapshot, metal_type_snapshot, quantity, vendor_earning, fulfillment_status, orders(id, created_at, payment_status, shipping_name, shipping_city)"
    )
    .eq("vendor_id", user!.id)
    .order("id", { ascending: false });

  const all = (items ?? []).filter((item) => {
    const order = Array.isArray(item.orders) ? item.orders[0] : item.orders;
    return order?.payment_status === "paid";
  });

  return (
    <div>
      <h2 className="text-lg font-semibold text-neutral-900">Orders</h2>

      <div className="mt-4 space-y-3">
        {all.length === 0 ? (
          <p className="text-sm text-neutral-500">No paid orders yet.</p>
        ) : (
          all.map((item) => {
            const order = Array.isArray(item.orders) ? item.orders[0] : item.orders;
            return (
              <Link
                key={item.id}
                href={`/vendor/orders/${item.id}`}
                className="flex items-center justify-between gap-4 rounded-lg border border-neutral-200 p-4 hover:border-neutral-400"
              >
                <div>
                  <p className="font-medium text-neutral-900">
                    {item.product_title_snapshot}
                    {item.metal_type_snapshot ? ` (${item.metal_type_snapshot.replace("_", " ")})` : ""}
                    {" × "}
                    {item.quantity}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {order?.shipping_name} &middot; {order?.shipping_city} &middot;{" "}
                    {order?.created_at && new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-neutral-500">
                    {currencyFormatter.format(item.vendor_earning)}
                  </span>
                  <Badge tone={STATUS_TONE[item.fulfillment_status as keyof typeof STATUS_TONE]}>
                    {item.fulfillment_status.replace("_", " ")}
                  </Badge>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
