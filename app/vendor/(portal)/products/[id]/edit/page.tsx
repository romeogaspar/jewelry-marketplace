import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateProduct } from "@/lib/actions/products";
import ProductForm from "../../ProductForm";

export const dynamic = "force-dynamic";

export default async function EditVendorProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: categories }, { data: product }, { data: variants }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, parent_id, name, level")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("products")
      .select("id, title, description, base_price, stock, category_id, primary_image_url")
      .eq("id", id)
      .single(),
    supabase
      .from("product_variants")
      .select("metal_type, swatch_hex, price_delta, stock, image_url")
      .eq("product_id", id),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-neutral-900">Edit Product</h2>
      <p className="mt-1 mb-4 text-sm text-neutral-500">
        Saving changes moves this listing back into the approval queue.
      </p>
      <ProductForm
        categories={categories ?? []}
        existingProduct={{ ...product, variants: variants ?? [] }}
        action={updateProduct}
        submitLabel="Save Changes"
      />
    </div>
  );
}
