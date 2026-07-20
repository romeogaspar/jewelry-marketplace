"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";
import { slugify } from "../slugify";

export type FormState = { error?: string };

const METAL_TYPES = ["white_gold", "yellow_gold", "rose_gold", "silver"] as const;

function readVariants(formData: FormData) {
  return METAL_TYPES.map((metalType) => ({
    metalType,
    enabled: formData.get(`variant-${metalType}-enabled`) === "on",
    swatchHex: String(formData.get(`variant-${metalType}-hex`) ?? "#cccccc"),
    priceDelta: Number(formData.get(`variant-${metalType}-price-delta`) ?? 0),
    stock: Number(formData.get(`variant-${metalType}-stock`) ?? 0),
    imageUrl: String(formData.get(`variant-${metalType}-image-url`) ?? "").trim() || null,
  }));
}

async function syncVariants(supabase: Awaited<ReturnType<typeof createClient>>, productId: string, variants: ReturnType<typeof readVariants>) {
  for (const variant of variants) {
    if (variant.enabled) {
      await supabase.from("product_variants").upsert(
        {
          product_id: productId,
          metal_type: variant.metalType,
          swatch_hex: variant.swatchHex,
          price_delta: variant.priceDelta,
          stock: variant.stock,
          image_url: variant.imageUrl,
        },
        { onConflict: "product_id,metal_type" }
      );
    } else {
      await supabase
        .from("product_variants")
        .delete()
        .eq("product_id", productId)
        .eq("metal_type", variant.metalType);
    }
  }
}

export async function createProduct(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const basePrice = Number(formData.get("base-price"));
  const stock = Number(formData.get("stock"));
  const categoryId = String(formData.get("category-id") ?? "");
  const primaryImageUrl = String(formData.get("primary-image-url") ?? "").trim();

  if (!title) {
    return { error: "Please enter a product title." };
  }
  if (!categoryId) {
    return { error: "Please choose a category." };
  }
  if (Number.isNaN(basePrice) || basePrice < 0) {
    return { error: "Please enter a valid price." };
  }
  if (Number.isNaN(stock) || stock < 0) {
    return { error: "Please enter a valid stock quantity." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired. Please sign in again." };
  }

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      vendor_id: user.id,
      category_id: categoryId,
      title,
      slug: slugify(title, Date.now().toString(36)),
      description,
      base_price: basePrice,
      stock,
      primary_image_url: primaryImageUrl || null,
    })
    .select("id")
    .single();

  if (error || !product) {
    return { error: error?.message ?? "Could not create product." };
  }

  await syncVariants(supabase, product.id, readVariants(formData));

  revalidatePath("/vendor/products");
  redirect("/vendor/products");
}

export async function updateProduct(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const id = String(formData.get("id"));
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const basePrice = Number(formData.get("base-price"));
  const stock = Number(formData.get("stock"));
  const categoryId = String(formData.get("category-id") ?? "");
  const primaryImageUrl = String(formData.get("primary-image-url") ?? "").trim();

  if (!title) {
    return { error: "Please enter a product title." };
  }
  if (!categoryId) {
    return { error: "Please choose a category." };
  }
  if (Number.isNaN(basePrice) || basePrice < 0) {
    return { error: "Please enter a valid price." };
  }
  if (Number.isNaN(stock) || stock < 0) {
    return { error: "Please enter a valid stock quantity." };
  }

  const supabase = await createClient();

  // Editing a product resubmits it for review — an approved listing can't be
  // silently changed without the admin seeing the new version. The
  // products_force_pending update trigger only locks the status column
  // itself, so this explicit reset is what actually re-queues it.
  const { error } = await supabase
    .from("products")
    .update({
      category_id: categoryId,
      title,
      description,
      base_price: basePrice,
      stock,
      primary_image_url: primaryImageUrl || null,
      status: "pending",
      reviewed_by: null,
      reviewed_at: null,
      rejection_reason: null,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  await syncVariants(supabase, id, readVariants(formData));

  revalidatePath("/vendor/products");
  redirect("/vendor/products");
}
