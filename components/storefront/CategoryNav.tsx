import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function CategoryNav() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, slug, name, level")
    .eq("level", 1)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const topLevel = categories ?? [];

  if (topLevel.length === 0) return null;

  return (
    <nav className="border-b border-neutral-100 bg-neutral-50">
      <div className="mx-auto flex max-w-6xl flex-wrap gap-4 px-4 py-2 text-sm">
        {topLevel.map((c) => (
          <Link
            key={c.id}
            href={`/category/${c.slug}`}
            className="text-neutral-600 hover:text-neutral-900"
          >
            {c.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}
