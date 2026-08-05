import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { browseCategories, type CategoryNode } from "@/lib/categoryTree";

export default async function CategoryNav() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, parent_id, slug, name, level, sort_order")
    .eq("is_active", true);

  const categories = browseCategories((data ?? []) as CategoryNode[]);

  if (categories.length === 0) return null;

  return (
    <nav className="border-t border-hairline">
      <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-8 gap-y-2 px-4 py-3 text-xs font-medium uppercase tracking-widest text-ink">
        {categories.map((c) => (
          <Link key={c.id} href={`/category/${c.path}`} className="hover:text-gold">
            {c.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}
