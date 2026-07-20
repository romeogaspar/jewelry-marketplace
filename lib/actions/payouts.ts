"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../supabase/server";
import { createServiceClient } from "../supabase/service";
import { getPendingPayoutSummary } from "../payouts/calculate";

export async function createPayoutBatch(formData: FormData) {
  const vendorId = String(formData.get("vendor-id"));

  const supabase = createServiceClient();
  const [summary] = await getPendingPayoutSummary(supabase, vendorId);

  if (!summary || summary.itemIds.length === 0) {
    return;
  }

  const { data: payout, error } = await supabase
    .from("payouts")
    .insert({
      vendor_id: vendorId,
      amount: summary.amount,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !payout) {
    return;
  }

  // Batching links these items to the payout but does NOT mark them
  // payout_released — that only happens once the admin actually records the
  // manual bank transfer as sent (markPayoutPaid).
  await supabase
    .from("order_items")
    .update({ payout_id: payout.id })
    .in("id", summary.itemIds);

  revalidatePath("/admin/payouts");
}

export async function markPayoutPaid(formData: FormData) {
  const payoutId = String(formData.get("payout-id"));
  const bankReference = String(formData.get("bank-reference") ?? "").trim();

  if (!bankReference) {
    return;
  }

  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  const supabase = createServiceClient();

  await supabase
    .from("payouts")
    .update({
      status: "paid",
      bank_reference: bankReference,
      paid_at: new Date().toISOString(),
      recorded_by: user?.id ?? null,
    })
    .eq("id", payoutId);

  const { data: items } = await supabase
    .from("order_items")
    .update({ fulfillment_status: "payout_released" })
    .eq("payout_id", payoutId)
    .select("vendor_id");

  const vendorId = items?.[0]?.vendor_id;
  if (vendorId) {
    await supabase.from("notifications").insert({
      recipient_id: vendorId,
      type: "payout_sent",
      title: "Payout sent",
      body: `A payout of your pending earnings has been recorded (ref: ${bankReference}).`,
      link_href: "/vendor/payouts",
    });
  }

  revalidatePath("/admin/payouts");
  revalidatePath("/vendor/payouts");
}
