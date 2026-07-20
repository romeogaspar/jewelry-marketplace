"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../supabase/server";

export async function markNotificationRead(formData: FormData) {
  const id = String(formData.get("id"));

  const supabase = await createClient();
  await supabase.from("notifications").update({ is_read: true }).eq("id", id);

  revalidatePath("/vendor/notifications");
}
