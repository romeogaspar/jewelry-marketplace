import { createClient } from "@/lib/supabase/server";
import { approveProduct, rejectProduct } from "@/lib/actions/admin-products";
import Button from "@/components/ui/Button";
import { currencyFormatter } from "@/lib/formatting";

export const dynamic = "force-dynamic";

export default async function AdminProductsPendingPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select(
      "id, title, base_price, stock, primary_image_url, created_at, vendors(business_name), categories(name)"
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const all = products ?? [];

  return (
    <div>
      <h2 className="text-lg font-semibold text-neutral-900">Product Queue</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Vendor-submitted products sit here until approved or rejected.
      </p>

      <div className="mt-4 space-y-4">
        {all.length === 0 ? (
          <p className="text-sm text-neutral-500">Nothing pending review.</p>
        ) : (
          all.map((product) => {
            const vendor = Array.isArray(product.vendors) ? product.vendors[0] : product.vendors;
            const category = Array.isArray(product.categories) ? product.categories[0] : product.categories;

            return (
              <div key={product.id} className="rounded-lg border border-neutral-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-neutral-900">{product.title}</p>
                    <p className="text-xs text-neutral-500">
                      {vendor?.business_name} &middot; {category?.name} &middot;{" "}
                      {currencyFormatter.format(product.base_price)} &middot; stock {product.stock}
                    </p>
                  </div>
                  {product.primary_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.primary_image_url}
                      alt={product.title}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-neutral-100 pt-3">
                  <form action={approveProduct}>
                    <input type="hidden" name="id" value={product.id} />
                    <Button type="submit">Approve</Button>
                  </form>
                  <form action={rejectProduct} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={product.id} />
                    <input
                      type="text"
                      name="rejection-reason"
                      placeholder="Reason for rejection"
                      className="rounded-lg border border-neutral-300 px-2 py-1 text-sm"
                    />
                    <Button type="submit" variant="danger">
                      Reject
                    </Button>
                  </form>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
