"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../supabase/server";
import { createServiceClient } from "../supabase/service";

export async function markPickedUp(formData: FormData) {
  const orderItemId = String(formData.get("order-item-id"));

  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  const supabase = createServiceClient();

  // Guard against marking pickup on an item whose order hasn't actually
  // been paid — the order_items row alone doesn't carry payment_status.
  const { data: item } = await supabase
    .from("order_items")
    .select("id, order_id, orders(payment_status)")
    .eq("id", orderItemId)
    .single();

  const order = item
    ? Array.isArray(item.orders)
      ? item.orders[0]
      : item.orders
    : null;

  if (!item || order?.payment_status !== "paid") {
    return;
  }

  await supabase
    .from("order_items")
    .update({
      fulfillment_status: "picked_up",
      picked_up_at: new Date().toISOString(),
      picked_up_by: user?.id ?? null,
    })
    .eq("id", orderItemId);

  revalidatePath("/admin/orders");
  revalidatePath("/vendor/orders");
}
