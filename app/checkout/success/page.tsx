import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Button from "@/components/ui/Button";
import { currencyFormatter } from "@/lib/formatting";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderId } = await searchParams;
  const supabase = await createClient();

  const { data: order } = orderId
    ? await supabase
        .from("orders")
        .select("id, total_amount, payment_status, created_at")
        .eq("id", orderId)
        .single()
    : { data: null };

  return (
    <div className="mx-auto mt-16 max-w-md px-4 text-center">
      <span className="text-4xl">✓</span>
      <h1 className="mt-2 text-2xl font-semibold text-neutral-900">Order Placed!</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Thanks for your order. We&apos;ll notify the vendor(s) right away.
      </p>

      {order && (
        <p className="mt-4 text-sm text-neutral-700">
          Order total: {currencyFormatter.format(order.total_amount)}
        </p>
      )}

      <div className="mt-6 flex justify-center gap-3">
        <Link href="/account">
          <Button variant="secondary">View Order History</Button>
        </Link>
        <Link href="/">
          <Button>Continue Shopping</Button>
        </Link>
      </div>
    </div>
  );
}
