"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../supabase/server";
import { createServiceClient } from "../supabase/service";

export async function approveVendor(formData: FormData) {
  const id = String(formData.get("id"));

  // The service client has no session of its own (it's stateless, keyed
  // only by the service-role key), so the current admin's id has to come
  // from the cookie-based client instead.
  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  const supabase = createServiceClient();
  await supabase
    .from("vendors")
    .update({
      is_approved: true,
      approved_at: new Date().toISOString(),
      approved_by: user?.id ?? null,
    })
    .eq("id", id);

  revalidatePath("/admin/vendors");
}

export async function suspendVendor(formData: FormData) {
  const id = String(formData.get("id"));

  const supabase = createServiceClient();
  await supabase
    .from("vendors")
    .update({ is_approved: false, approved_at: null, approved_by: null })
    .eq("id", id);

  revalidatePath("/admin/vendors");
}

export async function updateVendorCommission(formData: FormData) {
  const id = String(formData.get("id"));
  const commissionPct = Number(formData.get("commission-pct"));

  if (Number.isNaN(commissionPct) || commissionPct < 0 || commissionPct > 100) {
    return;
  }

  const supabase = createServiceClient();
  await supabase
    .from("vendors")
    .update({ commission_pct: commissionPct })
    .eq("id", id);

  revalidatePath("/admin/vendors");
}
