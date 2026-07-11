# Listing Layout Options Plan

## Summary
- Add a shared layout-selection system for storefront product listings on `/collections` and `/collections/[slug]`.
- Ship three layouts: `compact-grid`, `editorial-grid`, and `featured-grid`.
- Persist the selected layout in browser `localStorage` with `compact-grid` as the default.

## Key Changes
- Introduce a shared `ListingLayout` type and storage key in a central utility module.
- Add a reusable client-side `ListingLayoutSelector` with three explicit options and accessible active-state handling.
- Update `AllProductsClient` and `CollectionClient` to:
  - read the saved layout preference
  - render the selector in the listing toolbar/header
  - switch listing container classes without changing data/analytics behavior
- Extend `ProductCard` with a layout variant prop and CSS modifiers instead of duplicating card logic.
- Keep existing product analytics, filters, sort, wishlist interactions, and infinite scroll behavior intact.

## Public Interfaces / Types
- `ListingLayout = "compact-grid" | "editorial-grid" | "featured-grid"`
- `ProductCard` accepts `layout?: ListingLayout`
- `ListingLayoutSelector` accepts:
  - `value: ListingLayout`
  - `onChange: (layout: ListingLayout) => void`
  - `className?: string`

## Test Plan
- Verify `/collections` defaults to `compact-grid` when no saved preference exists.
- Verify changing layout persists after reload and is reused on `/collections/[slug]`.
- Verify category filters, sorting, and infinite scroll still work in all layouts.
- Verify `/collections` infinite scroll appends products correctly in all layouts.
- Verify wishlist toggle, badges, and product navigation work in all layouts.
- Verify selector keyboard access, visible active state, and mobile responsiveness.
- Run `eslint` and a production build check after implementation.

## Assumptions
- Persistence uses `localStorage`, not URL params or server-side user preferences.
- The same layout preference applies across both supported storefront listing surfaces.
- v1 scope excludes wishlist, related products, sliders, and admin/product management interfaces.
