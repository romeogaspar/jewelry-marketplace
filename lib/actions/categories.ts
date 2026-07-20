"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "../supabase/service";
import { slugify } from "../slugify";

export type FormState = { error?: string };

export async function createCategory(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const parentId = String(formData.get("parent-id") ?? "");

  if (!name) {
    return { error: "Please enter a category name." };
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("categories").insert({
    name,
    slug: slugify(name),
    parent_id: parentId || null,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "A category with that name already exists under this parent." };
    }
    return { error: error.message };
  }

  revalidatePath("/admin/categories");
  return {};
}

export async function toggleCategoryActive(formData: FormData) {
  const id = String(formData.get("id"));
  const isActive = formData.get("is-active") === "true";

  const supabase = createServiceClient();
  await supabase.from("categories").update({ is_active: !isActive }).eq("id", id);

  revalidatePath("/admin/categories");
}

export async function deleteCategory(formData: FormData) {
  const id = String(formData.get("id"));

  const supabase = createServiceClient();
  await supabase.from("categories").delete().eq("id", id);

  revalidatePath("/admin/categories");
}
