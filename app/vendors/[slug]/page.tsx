import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/storefront/ProductCard";

export const dynamic = "force-dynamic";

export default async function VendorStorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: vendor } = await supabase
    .from("vendors_public")
    .select("id, business_name, slug")
    .eq("slug", slug)
    .single();

  if (!vendor) {
    notFound();
  }

  const { data: products } = await supabase
    .from("products")
    .select("id, slug, title, base_price, primary_image_url")
    .eq("vendor_id", vendor.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  const all = products ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="text-center">
        <h1 className="font-serif text-3xl italic text-ink">{vendor.business_name}</h1>
        <p className="mt-1 text-xs uppercase tracking-widest text-stone">{all.length} products</p>
      </div>

      <div className="mt-10">
        {all.length === 0 ? (
          <p className="text-center text-sm text-stone">No live products from this vendor yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-4">
            {all.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
