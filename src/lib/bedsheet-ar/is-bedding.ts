import { Category, Product } from "@/types";

const BEDDING_SLUG_KEYWORDS = [
  "bedding",
  "bedsheet",
  "bed-sheet",
  "bedsheets",
  "bed-sheets",
  "single-bed",
  "double-bed",
  "king-bed",
  "queen-bed",
  "duvet",
  "quilt",
  "fitted-sheet",
  "bed-set",
  "bed-cover",
  "pillow",
  "cushion",
  "comforter",
];

const BEDDING_NAME_KEYWORDS = [
  "bedding",
  "bedsheet",
  "bed sheet",
  "bed-sheet",
  "bed set",
  "duvet",
  "quilt",
  "pillow",
  "cushion",
  "comforter",
  "single bed",
  "double bed",
  "king bed",
];

/**
 * Determines whether a category belongs to the Bedding parent or any of its sub-categories.
 */
export function isBeddingCategory(
  category?: Category | null,
  allCategories?: Category[] | null
): boolean {
  if (!category) return false;

  const slug = (category.slug || "").toLowerCase();
  const name = (category.name || "").toLowerCase();

  // 1. Direct keyword match in category slug
  if (BEDDING_SLUG_KEYWORDS.some((kw) => slug.includes(kw))) {
    return true;
  }

  // 2. Direct keyword match in category name
  if (BEDDING_NAME_KEYWORDS.some((kw) => name.includes(kw))) {
    return true;
  }

  // 3. Check parent category hierarchy
  if (category.parent_id && allCategories && allCategories.length > 0) {
    const parent = allCategories.find((c) => c.id === category.parent_id);
    if (parent) {
      const parentSlug = (parent.slug || "").toLowerCase();
      const parentName = (parent.name || "").toLowerCase();
      if (
        parentSlug === "bedding" ||
        parentSlug.includes("bed") ||
        parentName.includes("bedding") ||
        parentName.includes("bed")
      ) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Determines whether a product belongs to Bedding or any Bedding sub-category.
 */
export function isBeddingProduct(
  product?: Partial<Product> | null,
  allCategories?: Category[] | null
): boolean {
  if (!product) return false;

  // 1. Check attached category object
  if (product.category && isBeddingCategory(product.category, allCategories)) {
    return true;
  }

  // 2. Check category_id against category lookup list
  if (product.category_id && allCategories && allCategories.length > 0) {
    const matchedCategory = allCategories.find((c) => c.id === product.category_id);
    if (matchedCategory && isBeddingCategory(matchedCategory, allCategories)) {
      return true;
    }
  }

  // 3. Fallback keyword check on product name / slug / fabric
  const title = (product.name || "").toLowerCase();
  const slug = (product.slug || "").toLowerCase();
  const fabric = (product.fabric || "").toLowerCase();

  const TITLE_KEYWORDS = [
    "bedsheet",
    "bed sheet",
    "bed-sheet",
    "bedding",
    "duvet",
    "quilt",
    "comforter",
    "bed set",
    "fitted sheet",
  ];

  if (TITLE_KEYWORDS.some((kw) => title.includes(kw) || slug.includes(kw) || fabric.includes(kw))) {
    return true;
  }

  return false;
}
