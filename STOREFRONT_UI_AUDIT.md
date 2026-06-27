# Storefront UI Audit

Date: June 27, 2026  
Scope: Storefront routes and storefront components under `src/app` and `src/components/storefront`  
Method: Code-level UI/content scan. This report does not include browser screenshot QA or device-by-device visual testing.

## Executive Summary

The homepage and header have moved toward a stronger Pakistani fashion direction, but many storefront pages still use older luxury-boutique patterns, square cards, inconsistent copy, hardcoded links, and broken encoded characters. The biggest UX risk is not one individual page; it is that the site feels like multiple design systems stitched together.

Primary issues:

- Broken text encoding appears across many customer-facing pages and creates an unpolished impression.
- Brand language alternates between `Ayra`, `Ayraa`, `Ayra Collection`, `Ayraa Collection`, and `Ayraa Premium Collection`.
- Homepage styling is more modern than collections, product, cart, checkout, auth, and policy pages.
- Several links and interactions look real but are hardcoded, fake, or potentially broken.
- Product detail and checkout contain many inline styles, making the UI hard to standardize.
- Category-driven navigation is moving in the right direction, but footer and several pages still use static collection assumptions.

## Priority Roadmap

### P0 - Fix Before Further Visual Polish

- Fix mojibake/encoding artifacts across storefront copy, icons, measurements, currency, separators, arrows, and dashes.
- Standardize brand name to one form, preferably `Ayraa`, across metadata, headings, body copy, footer, legal pages, and maintenance pages.
- Replace invalid or risky collection links such as `/collections/ready-to-wear` if that slug is not guaranteed by admin data.
- Remove or clearly disable fake interactions, especially editorial article links using `#`, non-functional filters, and contact forms that simulate success without backend delivery.
- Normalize canonical/domain references. Current code uses a mix of `ayraa.pk`, `ayraacollection.vercel.app`, and `ayraacollection.com`.
- Ensure category links in header/footer come from admin-controlled category data or a single shared category service.

### P1 - Unify The Storefront Design System

- Create shared components for `PageHero`, `SectionHeader`, `EmptyState`, `PolicyLayout`, `FormField`, `StatusBadge`, `TrustStrip`, and `StorefrontCTA`.
- Align collections, product detail, cart, checkout, auth, and policy pages with the new homepage direction: softer editorial layouts, warmer Pakistani clothing language, consistent radius, consistent shadows, and consistent spacing.
- Replace page-specific inline styles with CSS module classes or shared components.
- Use the same header offset and page container rules across all storefront pages.
- Replace emoji/string icons with SVG/icon components to prevent encoding issues and improve accessibility.

### P2 - Improve Commerce UX

- Add a mobile filter drawer for collection pages.
- Improve product detail with clearer buy box hierarchy, size guidance, delivery promise, COD trust message, and return policy summary.
- Add checkout trust signals: COD, delivery timeline, WhatsApp support, return window, and step/progress context.
- Add quick commerce actions where appropriate: quick add, wishlist feedback, sale percentage, low-stock states, and product badges.
- Use category-specific filters instead of generic sizes/fabrics for every collection.

### P3 - Content Governance

- Move editorial articles, support content, footer collection links, and homepage promotional sections toward admin-managed content where possible.

- Add SEO fields per category: display name, nav label, hero title, meta title, meta description, header visibility, footer visibility, and sort order.

## Cross-Site Issues

### 1. Brand And Voice Consistency

Severity: High

The storefront mixes older generic luxury/couture language with the newer Pakistani wardrobe positioning. Examples include `Ayra`, `Ayraa`, `Ayra Collection`, `luxury couture`, `Eastern couture`, `Garments`, `Lawn Prints`, and `Pakistani Wardrobe`.

Recommended direction:

- Use `Ayraa` consistently.
- Replace generic luxury lines with market-specific language: lawn, pret, festive, daawat, daily wear, Pakistani seasons, and modest wardrobe.
- Avoid overlong subtitles. Keep hero and section copy short, confident, and easy to scan.

### 2. Broken Encoding / Mojibake

Severity: High

Many pages contain broken encoded characters such as `â€”`, `Â·`, `ðŸ`, `âœ`, `Ã`, and broken currency/measurement symbols. This appears in shipping, checkout, careers, maintenance, footer, editorial, FAQ, size guide, product detail, and other pages.

Recommended fixes:

- Replace all emoji text icons with icon components.
- Replace broken punctuation with normal ASCII or valid UTF-8.
- Add a lint/check script that scans storefront source for common mojibake patterns.
- Prefer plain text separators such as `-`, `/`, and `PKR` where possible.

### 3. Mixed Visual Systems

Severity: High

Homepage now uses a more editorial, modern, Pakistani wardrobe feel. Many other pages still use older square-card luxury styling. This makes the storefront feel inconsistent after navigation.

Recommended fixes:

- Define one storefront visual language: rounded editorial cards, warm neutral surfaces, gold as accent only, and consistent container widths.
- Rebuild page heroes with one shared `PageHero` component and variants.
- Reuse homepage section patterns for collections and category landing pages.

### 4. Hardcoded Links And Static Content

Severity: High

Several customer-facing links are hardcoded to collection slugs that may not exist, especially `/collections/ready-to-wear`. Editorial articles use `#`, and footer collections are static.

Recommended fixes:

- Build a shared category navigation source from admin-enabled categories.
- Provide fallback to `/collections`, not to one assumed slug.
- Hide editorial cards if articles do not have valid slugs.
- Treat footer collection links like header category links: admin controlled with sort order.

### 5. Layout And Spacing Consistency

Severity: Medium

Pages use different header offsets and spacing strategies: `pt-20 md:pt-16`, large manual paddings, CSS module hero spacing, sticky columns, and inline container rules.

Recommended fixes:

- Add a shared storefront page shell with consistent `main` padding and max-width.
- Use one header height token across Header, main content, drawers, sticky product sidebars, and policy pages.
- Standardize mobile vertical spacing so pages do not feel compressed or oversized.

### 6. Accessibility And Interaction

Severity: Medium

The header mega menu appears hover-driven, some filters look clickable but are not functional, icon strings are not accessible, and visual states often rely on color only.

Recommended fixes:

- Make mega menu keyboard-accessible with button semantics, focus states, and Escape/blur handling.
- Add mobile-friendly category navigation.
- Replace fake interactive elements with real buttons or static labels.
- Use accessible labels for icon-only controls.
- Avoid relying only on color for status badges and sale states.

### 7. Maintainability

Severity: Medium

Product detail, checkout, collection subcategory blocks, cart drawer, WhatsApp FAB, and some header actions use inline styles. This makes the design hard to audit or theme.

Recommended fixes:

- Move inline UI styles into CSS modules or shared components.
- Extract repeated commerce UI into smaller components.
- Keep product/review/Q&A UI separate from data-fetching and submission logic.

## Page-By-Page Findings

### Home

Status: Strongest storefront page visually.

Issues:

- Good new direction, but other pages do not match it yet.
- Some copy and fallback labels still carry older terminology.
- At least one inline style remains for sale overline color.
- Conditional sections can disappear and create uneven homepage rhythm.

Recommendations:

- Use the homepage as the baseline for refreshed section style.
- Keep hero/subtitle copy short.
- Ensure empty states or admin-hidden sections leave intentional spacing.

### Header / Navigation

Status: Improved, but needs governance and accessibility hardening.

Issues:

- Admin-controlled category visibility is the right model, but mega menu and footer are not fully aligned to the same source.
- Too many header-enabled parent categories may overflow desktop nav.
- Mega menu uses a fixed multi-column layout that may break with more categories.
- Hover-first mega menu can be weak on keyboard and touch devices.

Recommendations:

- Add `header_label`, `show_in_header`, `show_in_footer`, `nav_sort_order`, and SEO fields to category management.
- Limit top-level header categories; move the rest into `Shop`.
- Make category links derive from category slug and canonical SEO URL.
- Add unique stable keys using category IDs, not just hrefs.

### Footer

Status: Functional, but static.

Issues:

- Collection links are hardcoded and may diverge from admin categories.
- Footer copy says `Eastern pret and luxury couture`, which conflicts with newer Pakistani seasonal wardrobe positioning.
- Currency text has broken encoding.
- Newsletter form prevents default but does not submit anywhere.

Recommendations:

- Make footer category links admin-controlled.
- Change copy to match the site’s current voice.
- Wire newsletter to a real endpoint or label it as coming soon.

### Collections Index

Status: Usable, but visually behind homepage.

Issues:

- Hero and cards feel older and flatter than the homepage.
- Copy still references `Lawn Prints`, `Garments`, `Bedding`, and `Hijab Collection`.
- Some category fallback content is hardcoded.
- Base URL values are inconsistent with other pages.

Recommendations:

- Rework as a Pakistani wardrobe landing page.
- Use homepage-style category cards with clearer labels: `Lawn`, `Pret`, `Festive`, `Modest`, `Home`.
- Pull all category names, images, SEO descriptions, and sort order from admin data.

### Collection Detail / Product Listing

Status: Functional product grid with useful filters.

Issues:

- Filter UI is not ideal on mobile; long filters can push products down.
- Fabric and size filters are generic and may not apply to every category.
- Subcategory card section uses extensive inline styles.
- Loading sentinel uses inline styles.

Recommendations:

- Add mobile filter drawer.
- Make filters category-aware.
- Move subcategory landing design into reusable components.
- Add sort, count, and applied-filter chips.

### Product Detail

Status: Feature-rich but visually and technically heavy.

Issues:

- Large component with many inline styles.
- Broken encoded characters appear in icons, accordion controls, review UI, and labels.
- Breadcrumb includes a hardcoded clothing route.
- Review image previews use native `img`.
- Q&A and reviews are visually useful but feel bolted onto the page.

Recommendations:

- Split into `ProductGallery`, `ProductBuyBox`, `ProductInfoAccordion`, `ReviewSummary`, `ReviewForm`, and `QuestionAnswer` components.
- Replace hardcoded breadcrumbs with product category data.
- Move all styling into CSS modules/components.
- Add concise trust blocks near add-to-cart: COD, delivery days, return window, WhatsApp support.

### Cart

Status: Clear enough for checkout progression.

Issues:

- Empty cart and continue-shopping links point to `/collections/ready-to-wear`.
- Visual style is more square/utilitarian than homepage.
- Cart drawer and cart page use some inline styles.

Recommendations:

- Use `/collections` as safe fallback or derive the last browsed valid category.
- Add cross-sell or `Continue Shopping` category chips.
- Align card radius, empty state, and summary styling with refreshed homepage.

### Checkout

Status: Functional COD checkout.

Issues:

- Payment and promo messages include broken encoded characters.
- Some form and discount UI uses inline styles.
- Checkout lacks visible trust and step context.
- Form styling is not aligned with the newer editorial storefront direction.

Recommendations:

- Add checkout step/progress header.
- Add a trust strip: `Cash on Delivery`, `3-5 day delivery`, `WhatsApp support`, `3-day return window`.
- Standardize form fields with a shared `FormField` component.
- Keep order summary sticky on desktop and compact on mobile.

### Wishlist

Status: One of the more polished secondary pages.

Issues:

- Visual system is close but still separate from homepage.
- Empty state and cards should share tokens/components with cart and collections.
- No sorting or collection grouping.

Recommendations:

- Reuse product grid and empty-state components.
- Add item count, quick add, and remove feedback.

### Orders

Status: Functional account utility page.

Issues:

- Empty state links to `/collections/ready-to-wear`.
- Loading and link styles include inline styling.
- Status badge colors are isolated from a shared badge system.

Recommendations:

- Use shared `StatusBadge`.
- Add order timeline styling.
- Use `/collections` or admin-driven category fallback.

### Login / Register

Status: Functional but generic.

Issues:

- Login and register styles are duplicated.
- Register subtitle contains broken encoded text.
- Auth card design feels disconnected from the homepage and commerce pages.

Recommendations:

- Create one shared auth layout.
- Add brand-specific microcopy and a small trust panel.
- Keep the form minimal and mobile-first.

### About

Status: Present, but not aligned with current positioning.

Issues:

- Uses `Ayra` in several places.
- Copy is generic luxury/couture rather than specific to Pakistani wardrobes.
- Icons contain broken encoding.
- Hero style feels older than the refreshed homepage.

Recommendations:

- Rewrite around `Ayraa` as Pakistani clothing, everyday grace, daawat dressing, seasonal lawn, and festive wardrobes.
- Replace broken icons with SVG icons or remove them.
- Use the same `PageHero` and editorial image treatment as the homepage.

### Contact

Status: Basic contact page.

Issues:

- Form simulates success but does not submit to a backend.
- Contact icons have broken encoding.
- Styling is older and square compared with homepage.

Recommendations:

- Wire the form to a real endpoint or Supabase table before showing success.
- Prioritize WhatsApp, COD help, order support, and delivery queries.
- Use consistent form component styling.

### Editorial

Status: Good concept, incomplete execution.

Issues:

- Article slugs use `#`, so cards appear clickable without real content.
- Category filter chips look interactive but do not filter.
- Copy uses `Ayra` and contains broken separators.

Recommendations:

- Either build article detail pages or make cards non-clickable until content exists.
- Move articles to admin/CMS or a structured content file.
- Make category filters functional or convert them to static labels.

### FAQ

Status: Useful structure.

Issues:

- Icon strings have broken encoding.
- Some language uses older `Ayra` naming.
- Hero/card style does not fully match homepage.

Recommendations:

- Replace icons with SVG components.
- Group FAQs by actual customer intent: orders, delivery, COD, returns, sizing, products.
- Add direct links to WhatsApp and shipping policy in relevant answers.

### Size Guide

Status: Content is valuable.

Issues:

- Measurements and icons contain broken encoding.
- Tables can be heavy on mobile.
- Brand naming and copy need normalization.

Recommendations:

- Convert mobile tables into stacked measurement cards.
- Add product-specific size guidance from product/category data.
- Link size guide directly from product size selector.

### Shipping & Returns

Status: Clear policy content.

Issues:

- Icons, dashes, and bullets have broken encoding.
- Brand metadata uses `Ayra Collection`.
- Policy card style differs from homepage.

Recommendations:

- Fix encoding immediately.
- Use shared policy layout.
- Add concise summary cards at top: processing, delivery, COD, returns.

### Terms & Privacy

Status: Complete enough for legal content.

Issues:

- Brand naming uses `Ayra Collection`.
- Some punctuation is broken.
- Long legal content has a different layout rhythm from other support pages.

Recommendations:

- Normalize brand and domain.
- Use shared policy layout and consistent table-of-contents styling.

### Careers

Status: Nice support page idea, but off-brand.

Issues:

- Copy says `Ayra`; metadata contains broken characters.
- Icons and separators are broken.
- Some roles and values skew toward couture/fashion house language rather than the current commerce identity.

Recommendations:

- Refresh copy for a growing Pakistani e-commerce brand.
- Replace broken icons.
- Add a simpler application flow with clear email/WhatsApp contact.

### Coming Soon

Status: More aligned with current Pakistani product direction.

Issues:

- Needs to be checked visually against the main homepage theme.
- Should not introduce separate brand patterns that later need to be reconciled.

Recommendations:

- Reuse homepage hero/CTA language.
- Keep pre-booking flow consistent with WhatsApp and COD messaging.

### Maintenance

Status: Standalone utility page.

Issues:

- Broken icon and broken `pret-a-porter` text.
- Contact email/domain differs from `ayraa.pk`.
- Copy is older luxury/bespoke positioning.

Recommendations:

- Rewrite to match current storefront language.
- Use current support email/domain.
- Avoid emoji text icon.

## Recommended Design System Inventory

Build or standardize these components before doing another broad visual refresh:

- `StorefrontShell`: shared page wrapper with Header, Footer, main spacing, and background.
- `PageHero`: variants for commerce, editorial, support, legal, and auth.
- `SectionHeader`: kicker, title, short subtitle, and optional CTA.
- `CategoryCard`: one style used on homepage, collections page, footer/admin previews.
- `ProductGridToolbar`: count, sort, filter button, active filters.
- `FilterDrawer`: mobile-first filter panel.
- `EmptyState`: shared across cart, wishlist, orders, collections, search.
- `FormField`: shared inputs, labels, errors, hints.
- `Button`: primary, secondary, ghost, text, danger, full-width mobile.
- `StatusBadge`: order status, sale, stock, new, featured.
- `TrustStrip`: COD, delivery, returns, WhatsApp support.

## Content Direction Suggestions

Use concise Pakistani clothing language:

- `Lawn for long afternoons`
- `Pret for everyday plans`
- `Festive for daawats`
- `Modest layers, softly finished`
- `Home textiles for graceful routines`
- `New edits for Pakistani seasons`
- `Easy silhouettes, ready for the day`

Avoid:

- Overusing `quiet luxury`
- Generic `premium fashion house`
- Vague `heritage craftsmanship` unless the product actually supports it
- Long subtitles under every section
- `Garments` as a customer-facing category label

## Suggested Implementation Sequence

1. Fix encoding and broken/fake links first.
2. Normalize brand/domain/copy across all pages.
3. Create shared page and commerce components.
4. Refresh collections, product detail, cart, and checkout using the shared components.
5. Refresh support/auth/policy pages.
6. Move footer, editorial, FAQs, and category navigation toward admin-controlled content.

## Audit Coverage

Pages reviewed:

- Home
- Header/navigation
- Footer
- Collections index
- Collection detail/listing
- Product detail
- Cart
- Checkout
- Wishlist
- Orders
- Login
- Register
- About
- Contact
- Editorial
- FAQ
- Size Guide
- Shipping & Returns
- Terms & Privacy
- Careers
- Coming Soon
- Maintenance

Components reviewed at code level:

- Header
- Footer
- Product cards
- Featured slider
- Hero slider
- Newsletter CTA
- Cart drawer
- WhatsApp floating action

