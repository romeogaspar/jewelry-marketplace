import { createClient } from "@/lib/supabase/server";
import { createProduct } from "@/lib/actions/products";
import ProductForm from "../ProductForm";

export const dynamic = "force-dynamic";

export default async function NewVendorProductPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, parent_id, name, level")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <div>
      <h2 className="text-lg font-semibold text-neutral-900">Add Product</h2>
      <p className="mt-1 mb-4 text-sm text-neutral-500">
        New listings go into the admin approval queue before appearing on the
        storefront.
      </p>
      <ProductForm
        categories={categories ?? []}
        action={createProduct}
        submitLabel="Submit for Approval"
      />
    </div>
  );
}
