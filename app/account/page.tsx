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

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, total_amount, payment_status, created_at, order_items(id, product_title_snapshot, metal_type_snapshot, quantity, unit_price, fulfillment_status)")
    .eq("customer_id", user!.id)
    .order("created_at", { ascending: false });

  const all = orders ?? [];

  return (
    <div>
      <h2 className="font-serif text-xl italic text-ink">Order History</h2>

      {all.length === 0 ? (
        <p className="mt-2 text-sm text-stone">You haven&apos;t placed any orders yet.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {all.map((order) => (
            <div key={order.id} className="border border-hairline p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-stone">
                  {new Date(order.created_at).toLocaleDateString()}
                </p>
                <Badge tone={PAYMENT_TONE[order.payment_status as keyof typeof PAYMENT_TONE]}>
                  {order.payment_status}
                </Badge>
              </div>
              <ul className="mt-2 space-y-1 text-sm text-ink">
                {order.order_items.map((item) => (
                  <li key={item.id}>
                    {item.product_title_snapshot}
                    {item.metal_type_snapshot ? ` (${item.metal_type_snapshot.replace("_", " ")})` : ""}
                    {" × "}
                    {item.quantity} — {currencyFormatter.format(item.unit_price * item.quantity)}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-sm font-medium text-ink">
                Total: {currencyFormatter.format(order.total_amount)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
