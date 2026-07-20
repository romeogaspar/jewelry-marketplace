import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { currencyFormatter } from "@/lib/formatting";

export const dynamic = "force-dynamic";

const STATUS_TONE = {
  awaiting_pickup: "amber",
  picked_up: "blue",
  payout_released: "green",
} as const;

export default async function VendorOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("order_items")
    .select(
      "id, product_title_snapshot, metal_type_snapshot, quantity, unit_price, line_total, vendor_earning, commission_amount, fulfillment_status, orders(shipping_name, shipping_address_line1, shipping_address_line2, shipping_city, shipping_state, shipping_postal_code, shipping_country, shipping_phone, created_at, payment_status)"
    )
    .eq("id", id)
    .single();

  if (!item) {
    notFound();
  }

  const order = Array.isArray(item.orders) ? item.orders[0] : item.orders;

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">
          {item.product_title_snapshot}
        </h2>
        <Badge tone={STATUS_TONE[item.fulfillment_status as keyof typeof STATUS_TONE]}>
          {item.fulfillment_status.replace("_", " ")}
        </Badge>
      </div>

      <div className="mt-4 rounded-lg border border-neutral-200 p-4 text-sm">
        <p>
          {item.metal_type_snapshot ? `${item.metal_type_snapshot.replace("_", " ")} · ` : ""}
          Qty {item.quantity} &middot; {currencyFormatter.format(item.unit_price)} each
        </p>
        <p className="mt-2 text-neutral-500">
          Line total {currencyFormatter.format(item.line_total)} — commission{" "}
          {currencyFormatter.format(item.commission_amount)} — you earn{" "}
          <span className="font-medium text-neutral-900">
            {currencyFormatter.format(item.vendor_earning)}
          </span>
        </p>
      </div>

      <div className="mt-4 rounded-lg border border-neutral-200 p-4 text-sm">
        <p className="mb-1 text-xs uppercase tracking-wide text-neutral-400">Ship to</p>
        <p className="font-medium text-neutral-900">{order?.shipping_name}</p>
        <p>{order?.shipping_address_line1}</p>
        {order?.shipping_address_line2 && <p>{order.shipping_address_line2}</p>}
        <p>
          {[order?.shipping_city, order?.shipping_state, order?.shipping_postal_code]
            .filter(Boolean)
            .join(", ")}
        </p>
        <p>{order?.shipping_country}</p>
        {order?.shipping_phone && <p>{order.shipping_phone}</p>}
      </div>

      <div className="mt-6">
        <a href={`/vendor/orders/${item.id}/label`} target="_blank" rel="noreferrer">
          <Button>Print Shipping Label</Button>
        </a>
      </div>
    </div>
  );
}
