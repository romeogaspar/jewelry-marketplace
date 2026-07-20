"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../supabase/server";
import { createServiceClient } from "../supabase/service";

export async function approveProduct(formData: FormData) {
  const id = String(formData.get("id"));

  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  const supabase = createServiceClient();
  await supabase
    .from("products")
    .update({
      status: "approved",
      rejection_reason: null,
      reviewed_by: user?.id ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/admin/products/pending");
  revalidatePath("/vendor/products");
}

export async function rejectProduct(formData: FormData) {
  const id = String(formData.get("id"));
  const reason = String(formData.get("rejection-reason") ?? "").trim();

  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  const supabase = createServiceClient();
  await supabase
    .from("products")
    .update({
      status: "rejected",
      rejection_reason: reason || "No reason provided.",
      reviewed_by: user?.id ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/admin/products/pending");
  revalidatePath("/vendor/products");
}
