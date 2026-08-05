import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/storefront/ProductCard";
import { browseCategories, type CategoryNode } from "@/lib/categoryTree";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("id, slug, title, base_price, primary_image_url")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(24),
    supabase
      .from("categories")
      .select("id, parent_id, slug, name, level, sort_order")
      .eq("is_active", true),
  ]);

  const all = products ?? [];
  const topCategories = browseCategories((categories ?? []) as CategoryNode[]);

  return (
    <>
      <section className="border-b border-hairline bg-parchment">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:py-20 md:grid-cols-2 md:gap-16">
          <div className="text-center md:text-left">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold">
              Independent Makers · Hand-Approved
            </p>
            <h1 className="mt-5 font-serif text-4xl italic leading-tight text-ink sm:text-6xl">
              Fine jewelry, chosen with care
            </h1>
            <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-stone md:mx-0">
              Every piece in the collection is reviewed by hand before it goes
              live — nothing arrives here by accident.
            </p>
            <Link
              href="#new-arrivals"
              className="mt-8 inline-block border border-ink px-8 py-3 text-xs font-medium uppercase tracking-widest text-ink transition-colors hover:bg-ink hover:text-parchment"
            >
              Explore the Edit
            </Link>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden bg-parchment-deep">
            <Image
              src="/image/hero-jewelry.jpg"
              alt="Gold rings and a bracelet arranged on a smooth stone"
              fill
              priority
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {topCategories.length > 0 && (
        <section className="border-b border-hairline bg-parchment-deep">
          <div className="mx-auto max-w-5xl px-4 py-14">
            <div className="flex flex-wrap justify-center gap-x-10 gap-y-8">
              {topCategories.map((c) => (
                <Link
                  key={c.id}
                  href={`/category/${c.path}`}
                  className="group flex flex-col items-center gap-3"
                >
                  <span className="flex h-20 w-20 items-center justify-center rounded-full border border-gold-soft text-lg font-serif italic text-gold transition-colors group-hover:border-gold group-hover:bg-parchment">
                    {c.name.charAt(0)}
                  </span>
                  <span className="text-xs font-medium uppercase tracking-widest text-ink group-hover:text-gold">
                    {c.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="new-arrivals" className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-10 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold">
            The Edit
          </p>
          <h2 className="mt-2 font-serif text-3xl text-ink">New Arrivals</h2>
        </div>

        {all.length === 0 ? (
          <p className="text-center text-sm text-stone">
            No products are live yet — check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-4">
            {all.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
