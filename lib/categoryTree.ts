export type CategoryNode = {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  level: number;
  sort_order: number;
};

// Resolves a URL path like /category/jewelry/lab-grown/earrings to the
// matching category row by walking the slug segments level by level.
export function resolveCategoryByPath(
  categories: CategoryNode[],
  slugs: string[]
): CategoryNode | null {
  let parentId: string | null = null;
  let current: CategoryNode | null = null;

  for (const slug of slugs) {
    current =
      categories.find((c) => c.slug === slug && c.parent_id === parentId) ??
      null;
    if (!current) return null;
    parentId = current.id;
  }

  return current;
}

// All ids in the subtree rooted at rootId, including rootId itself — used so
// a parent category page shows products tagged to any of its descendants,
// not just ones tagged to that exact node.
export function descendantIds(categories: CategoryNode[], rootId: string) {
  const ids = [rootId];
  const stack = [rootId];

  while (stack.length > 0) {
    const parentId = stack.pop()!;
    for (const c of categories) {
      if (c.parent_id === parentId) {
        ids.push(c.id);
        stack.push(c.id);
      }
    }
  }

  return ids;
}

export function categoryPath(categories: CategoryNode[], categoryId: string) {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const chain: CategoryNode[] = [];
  let current = byId.get(categoryId);
  while (current) {
    chain.unshift(current);
    current = current.parent_id ? byId.get(current.parent_id) : undefined;
  }
  return chain;
}
