import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { getPaymentProvider } from "@/lib/payments";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return NextResponse.json({ error: "Missing webhook signature or secret." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getPaymentProvider().verifyWebhookSignature(rawBody, signature, secret) as Stripe.Event;
  } catch (err) {
    return NextResponse.json(
      { error: `Invalid signature: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;

    const { data: order } = await supabase
      .from("orders")
      .select("id, payment_status")
      .eq("stripe_payment_intent_id", intent.id)
      .single();

    // Idempotency: Stripe can redeliver the same event, and payment_status
    // only ever moves forward — re-running the stock decrement on a replay
    // would double-count it.
    if (order && order.payment_status !== "paid") {
      await supabase.from("orders").update({ payment_status: "paid" }).eq("id", order.id);

      const { data: items } = await supabase
        .from("order_items")
        .select("id, vendor_id, product_id, variant_id, quantity")
        .eq("order_id", order.id);

      for (const item of items ?? []) {
        if (item.variant_id) {
          const { data: variant } = await supabase
            .from("product_variants")
            .select("stock")
            .eq("id", item.variant_id)
            .single();
          if (variant) {
            await supabase
              .from("product_variants")
              .update({ stock: Math.max(0, variant.stock - item.quantity) })
              .eq("id", item.variant_id);
          }
        } else {
          const { data: product } = await supabase
            .from("products")
            .select("stock")
            .eq("id", item.product_id)
            .single();
          if (product) {
            await supabase
              .from("products")
              .update({ stock: Math.max(0, product.stock - item.quantity) })
              .eq("id", item.product_id);
          }
        }
      }

      const vendorIds = [...new Set((items ?? []).map((i) => i.vendor_id))];
      await supabase.from("notifications").insert(
        vendorIds.map((vendorId) => ({
          recipient_id: vendorId,
          type: "new_order",
          title: "New order received",
          body: "You have a new order awaiting pickup.",
          link_href: "/vendor/orders",
        }))
      );
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object as Stripe.PaymentIntent;
    await supabase
      .from("orders")
      .update({ payment_status: "failed" })
      .eq("stripe_payment_intent_id", intent.id);
  }

  return NextResponse.json({ received: true });
}
