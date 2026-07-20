export function slugify(text: string, uniqueSuffix?: string) {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return uniqueSuffix ? `${base}-${uniqueSuffix}` : base;
}
