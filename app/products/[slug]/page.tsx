import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductPurchasePanel from "./ProductPurchasePanel";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("id, vendor_id, title, description, base_price, stock, primary_image_url")
    .eq("slug", slug)
    .eq("status", "approved")
    .single();

  if (!product) {
    notFound();
  }

  // vendors' base RLS only allows a row's own vendor (or admin) to read it —
  // public storefront reads go through the vendors_public view instead,
  // which exposes just the safe columns for approved vendors.
  const [{ data: variants }, { data: vendor }] = await Promise.all([
    supabase
      .from("product_variants")
      .select("id, metal_type, swatch_hex, price_delta, stock, image_url")
      .eq("product_id", product.id),
    supabase
      .from("vendors_public")
      .select("business_name, slug")
      .eq("id", product.vendor_id)
      .single(),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <ProductPurchasePanel product={product} vendor={vendor ?? null} variants={variants ?? []} />
    </div>
  );
}
