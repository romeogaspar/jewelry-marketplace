import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { markPickedUp } from "@/lib/actions/fulfillment";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { currencyFormatter } from "@/lib/formatting";

export const dynamic = "force-dynamic";

const STATUS_TONE = {
  awaiting_pickup: "amber",
  picked_up: "blue",
  payout_released: "green",
} as const;

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, shipping_name, shipping_address_line1, shipping_address_line2, shipping_city, shipping_state, shipping_postal_code, shipping_country, shipping_phone, payment_status, total_amount, created_at"
    )
    .eq("id", id)
    .single();

  if (!order) {
    notFound();
  }

  const { data: items } = await supabase
    .from("order_items")
    .select(
      "id, product_title_snapshot, metal_type_snapshot, quantity, unit_price, line_total, vendor_earning, fulfillment_status, vendors(business_name)"
    )
    .eq("order_id", id);

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">{order.shipping_name}</h2>
        <Badge tone={order.payment_status === "paid" ? "green" : "amber"}>
          {order.payment_status}
        </Badge>
      </div>
      <p className="text-xs text-neutral-500">{new Date(order.created_at).toLocaleString()}</p>

      <div className="mt-4 rounded-lg border border-neutral-200 p-4 text-sm">
        <p className="mb-1 text-xs uppercase tracking-wide text-neutral-400">Ship to</p>
        <p>{order.shipping_address_line1}</p>
        {order.shipping_address_line2 && <p>{order.shipping_address_line2}</p>}
        <p>
          {[order.shipping_city, order.shipping_state, order.shipping_postal_code]
            .filter(Boolean)
            .join(", ")}
        </p>
        <p>{order.shipping_country}</p>
      </div>

      <div className="mt-4 space-y-3">
        {(items ?? []).map((item) => {
          const vendor = Array.isArray(item.vendors) ? item.vendors[0] : item.vendors;
          return (
            <div key={item.id} className="rounded-lg border border-neutral-200 p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-neutral-900">
                  {item.product_title_snapshot}
                  {item.metal_type_snapshot ? ` (${item.metal_type_snapshot.replace("_", " ")})` : ""}
                </p>
                <Badge tone={STATUS_TONE[item.fulfillment_status as keyof typeof STATUS_TONE]}>
                  {item.fulfillment_status.replace("_", " ")}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                {vendor?.business_name} &middot; qty {item.quantity} &middot;{" "}
                {currencyFormatter.format(item.line_total)} (vendor earns{" "}
                {currencyFormatter.format(item.vendor_earning)})
              </p>

              {order.payment_status === "paid" && item.fulfillment_status === "awaiting_pickup" && (
                <form action={markPickedUp} className="mt-3">
                  <input type="hidden" name="order-item-id" value={item.id} />
                  <Button type="submit">Mark Picked Up</Button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
