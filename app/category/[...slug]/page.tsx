import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CategoryNav from "@/components/storefront/CategoryNav";
import ProductCard from "@/components/storefront/ProductCard";
import {
  resolveCategoryByPath,
  descendantIds,
  categoryPath,
  type CategoryNode,
} from "@/lib/categoryTree";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: categoriesData } = await supabase
    .from("categories")
    .select("id, parent_id, name, slug, level, sort_order")
    .eq("is_active", true);

  const categories: CategoryNode[] = categoriesData ?? [];
  const current = resolveCategoryByPath(categories, slug);

  if (!current) {
    notFound();
  }

  const ids = descendantIds(categories, current.id);
  const children = categories
    .filter((c) => c.parent_id === current.id)
    .sort((a, b) => a.sort_order - b.sort_order);
  const breadcrumb = categoryPath(categories, current.id);

  const { data: products } = await supabase
    .from("products")
    .select("id, slug, title, base_price, primary_image_url")
    .in("category_id", ids)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  const all = products ?? [];

  return (
    <>
      <CategoryNav />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <nav className="mb-4 text-sm text-neutral-500">
          <Link href="/" className="hover:text-neutral-900">
            Home
          </Link>
          {breadcrumb.map((c, i) => (
            <span key={c.id}>
              {" / "}
              <Link
                href={`/category/${breadcrumb.slice(0, i + 1).map((b) => b.slug).join("/")}`}
                className="hover:text-neutral-900"
              >
                {c.name}
              </Link>
            </span>
          ))}
        </nav>

        <h1 className="text-2xl font-semibold text-neutral-900">{current.name}</h1>

        {children.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {children.map((child) => (
              <Link
                key={child.id}
                href={`/category/${[...slug, child.slug].join("/")}`}
                className="rounded-full border border-neutral-300 px-3 py-1 text-sm text-neutral-600 hover:border-neutral-900 hover:text-neutral-900"
              >
                {child.name}
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8">
          {all.length === 0 ? (
            <p className="text-sm text-neutral-500">No products in this category yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {all.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
