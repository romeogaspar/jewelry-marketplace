import { createClient } from "@/lib/supabase/server";
import { toggleCategoryActive, deleteCategory } from "@/lib/actions/categories";
import Badge from "@/components/ui/Badge";
import CategoryForm from "./CategoryForm";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, parent_id, name, slug, level, sort_order, is_active")
    .order("level", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  const all = categories ?? [];

  return (
    <div>
      <h2 className="text-lg font-semibold text-neutral-900">Categories</h2>
      <p className="mt-1 text-sm text-neutral-500">
        The main store nav, managed independently of vendor uploads. Up to 3
        levels deep.
      </p>

      <div className="mt-4">
        <CategoryForm categories={all} />
      </div>

      <div className="mt-6 divide-y divide-neutral-200 rounded-lg border border-neutral-200">
        {all.length === 0 ? (
          <p className="p-4 text-sm text-neutral-500">No categories yet.</p>
        ) : (
          all.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between gap-3 p-3"
              style={{ paddingLeft: `${1 + (category.level - 1) * 1.5}rem` }}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-900">{category.name}</span>
                <Badge tone={category.is_active ? "green" : "neutral"}>
                  {category.is_active ? "Active" : "Inactive"}
                </Badge>
                <span className="text-xs text-neutral-400">L{category.level}</span>
              </div>
              <div className="flex items-center gap-2">
                <form action={toggleCategoryActive}>
                  <input type="hidden" name="id" value={category.id} />
                  <input
                    type="hidden"
                    name="is-active"
                    value={String(category.is_active)}
                  />
                  <button
                    type="submit"
                    className="text-sm text-neutral-600 hover:text-neutral-900"
                  >
                    {category.is_active ? "Deactivate" : "Activate"}
                  </button>
                </form>
                <form action={deleteCategory}>
                  <input type="hidden" name="id" value={category.id} />
                  <button
                    type="submit"
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
