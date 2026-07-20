import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Badge from "@/components/ui/Badge";
import { currencyFormatter } from "@/lib/formatting";

export const dynamic = "force-dynamic";

const PAYMENT_TONE = {
  pending: "amber",
  paid: "green",
  failed: "red",
  refunded: "neutral",
} as const;

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, shipping_name, total_amount, payment_status, created_at")
    .order("created_at", { ascending: false });

  const all = orders ?? [];

  return (
    <div>
      <h2 className="text-lg font-semibold text-neutral-900">Orders</h2>

      <div className="mt-4 space-y-3">
        {all.length === 0 ? (
          <p className="text-sm text-neutral-500">No orders yet.</p>
        ) : (
          all.map((order) => (
            <Link
              key={order.id}
              href={`/admin/orders/${order.id}`}
              className="flex items-center justify-between gap-4 rounded-lg border border-neutral-200 p-4 hover:border-neutral-400"
            >
              <div>
                <p className="font-medium text-neutral-900">{order.shipping_name}</p>
                <p className="text-xs text-neutral-500">
                  {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-neutral-500">
                  {currencyFormatter.format(order.total_amount)}
                </span>
                <Badge tone={PAYMENT_TONE[order.payment_status as keyof typeof PAYMENT_TONE]}>
                  {order.payment_status}
                </Badge>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
