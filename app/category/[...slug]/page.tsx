import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
    <div className="mx-auto max-w-6xl px-4 py-12">
      <nav className="mb-6 text-xs uppercase tracking-widest text-stone">
        <Link href="/" className="hover:text-gold">
          Home
        </Link>
        {breadcrumb.map((c, i) => (
          <span key={c.id}>
            {" / "}
            <Link
              href={`/category/${breadcrumb.slice(0, i + 1).map((b) => b.slug).join("/")}`}
              className="hover:text-gold"
            >
              {c.name}
            </Link>
          </span>
        ))}
      </nav>

      <h1 className="text-center font-serif text-3xl italic text-ink sm:text-4xl">
        {current.name}
      </h1>

      {children.length > 0 && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {children.map((child) => (
            <Link
              key={child.id}
              href={`/category/${[...slug, child.slug].join("/")}`}
              className="border border-hairline px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-stone hover:border-gold hover:text-gold"
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-12">
        {all.length === 0 ? (
          <p className="text-center text-sm text-stone">
            No products in this category yet.
          </p>
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
