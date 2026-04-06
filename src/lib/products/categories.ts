export const DEFAULT_PRODUCT_CATEGORIES = [
  "lamp",
  "print",
  "enclosure",
  "decor",
  "other",
] as const;

export function normalizeProductCategory(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function formatProductCategoryLabel(category: string): string {
  return category
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function buildProductCategoryOptions(categories: string[]): string[] {
  return Array.from(
    new Set(
      [...DEFAULT_PRODUCT_CATEGORIES, ...categories]
        .map((category) => normalizeProductCategory(category))
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));
}
