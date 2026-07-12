export const LISTING_LAYOUT_STORAGE_KEY = "ayra_listing_layout";

export const LISTING_LAYOUTS = [
  "editorial-grid",
  "featured-grid",
] as const;

export type ListingLayout = (typeof LISTING_LAYOUTS)[number];

export const DEFAULT_LISTING_LAYOUT: ListingLayout = "editorial-grid";

export function isListingLayout(value: string | null | undefined): value is ListingLayout {
  return !!value && LISTING_LAYOUTS.includes(value as ListingLayout);
}
