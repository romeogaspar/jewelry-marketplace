import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { currencyFormatter } from "@/lib/formatting";

export const dynamic = "force-dynamic";

const STATUS_TONE = {
  pending: "amber",
  approved: "green",
  rejected: "red",
  archived: "neutral",
} as const;

export default async function VendorProductsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: products } = await supabase
    .from("products")
    .select("id, title, base_price, stock, status, rejection_reason, primary_image_url")
    .eq("vendor_id", user!.id)
    .order("created_at", { ascending: false });

  const all = products ?? [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">My Products</h2>
        <Link href="/vendor/products/new">
          <Button>+ Add Product</Button>
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        {all.length === 0 ? (
          <p className="text-sm text-neutral-500">
            You haven&apos;t listed any products yet.
          </p>
        ) : (
          all.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-neutral-200 p-4"
            >
              <div>
                <p className="font-medium text-neutral-900">{product.title}</p>
                <p className="text-xs text-neutral-500">
                  {currencyFormatter.format(product.base_price)} &middot; stock {product.stock}
                </p>
                {product.status === "rejected" && product.rejection_reason && (
                  <p className="mt-1 text-xs text-red-600">
                    Rejected: {product.rejection_reason}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={STATUS_TONE[product.status as keyof typeof STATUS_TONE]}>
                  {product.status}
                </Badge>
                <Link
                  href={`/vendor/products/${product.id}/edit`}
                  className="text-sm text-neutral-600 underline hover:text-neutral-900"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
