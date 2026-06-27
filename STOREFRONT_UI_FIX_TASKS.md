# Storefront UI Fix Tasks

Date: June 27, 2026  
Source: `STOREFRONT_UI_AUDIT.md`

## Phase 0 - Critical Cleanup

### Task 0.1 - Fix Broken Encoding Across Storefront

Priority: P0  
Owner area: Content/UI  
Dependencies: None

Scope:

- Search storefront files for mojibake patterns: `â`, `Ã`, `Â`, `ðŸ`, `âœ`, `â€“`, `â€”`, `â‚¨`.
- Fix broken punctuation, dashes, currency symbols, size measurements, stars, arrows, bullets, and icon text.
- Replace emoji-string icons with safe text or SVG/icon components.

Acceptance criteria:

- No storefront source under `src/app` or `src/components/storefront` contains common mojibake patterns.
- Currency displays as `PKR` or a valid rupee symbol consistently.
- Measurements and separators render correctly on size guide, footer, checkout, shipping, careers, maintenance, editorial, and product pages.

### Task 0.2 - Standardize Brand Name And Domain

Priority: P0  
Owner area: Content/SEO  
Dependencies: None

Scope:

- Choose one customer-facing brand name: `Ayraa`.
- Replace inconsistent names: `Ayra`, `Ayra Collection`, `Ayraa Premium Collection`, and mixed variants.
- Normalize support/domain references to one production domain and email pattern.
- Update metadata, Open Graph titles, legal copy, footer, maintenance page, and support pages.

Acceptance criteria:

- Storefront copy consistently uses `Ayraa`.
- Metadata and visible copy use the same domain.
- Footer, legal, support, and maintenance pages no longer conflict on brand identity.

### Task 0.3 - Fix Broken And Risky Links

Priority: P0  
Owner area: Routing/Content  
Dependencies: None

Scope:

- Replace unsafe `/collections/ready-to-wear` links with `/collections` or valid admin-derived category URLs.
- Replace editorial `#` links with real article routes or make cards non-clickable.
- Verify all footer collection links map to existing categories.
- Verify cart, orders, empty states, breadcrumbs, and continue-shopping links.

Acceptance criteria:

- No customer-facing CTA points to a missing route.
- No card that looks clickable uses `#`.
- Empty states route users to valid shopping destinations.

### Task 0.4 - Remove Fake Success Interactions

Priority: P0  
Owner area: Forms/UX  
Dependencies: None

Scope:

- Audit contact and newsletter forms.
- Either connect forms to a real endpoint or clearly change them to non-submitting placeholders.
- Avoid showing success messages unless the action actually succeeds.

Acceptance criteria:

- Contact form does not fake message delivery.
- Newsletter form has real submission, disabled state, or transparent coming-soon messaging.
- Failed submissions show useful error states.

## Phase 1 - Navigation And Category Governance

### Task 1.1 - Make Header Category Links Fully Admin-Controlled

Priority: P0  
Owner area: Header/Admin categories  
Dependencies: Task 0.3

Scope:

- Use admin-enabled parent categories for header category navigation.
- Support category fields: `show_in_header`, `header_label`, `nav_sort_order`, SEO title, SEO description, and canonical slug.
- Keep generic header links separate from category links.
- Ensure React keys use stable category IDs, not duplicated hrefs.

Acceptance criteria:

- Header category links are controlled by admin category settings.
- Generic links remain hardcoded only where appropriate.
- No duplicate-key warnings occur in the header.
- Category links use canonical category URLs.

### Task 1.2 - Make Footer Collections Admin-Controlled

Priority: P1  
Owner area: Footer/Admin categories  
Dependencies: Task 1.1

Scope:

- Add support for `show_in_footer` and footer sort order.
- Replace hardcoded footer collection links.
- Add safe fallback when no footer categories are enabled.

Acceptance criteria:

- Footer collection links match active admin categories.
- Disabled categories do not appear in footer.
- Footer remains usable if category data fails.

### Task 1.3 - Improve Header Accessibility And Overflow

Priority: P1  
Owner area: Header/UX  
Dependencies: Task 1.1

Scope:

- Make mega menu keyboard-accessible.
- Add Escape/blur behavior.
- Prevent top-level nav overflow when many categories are enabled.
- Add a max count or move extra categories into `Shop`.
- Improve touch/mobile behavior.

Acceptance criteria:

- Header can be used with keyboard.
- Mega menu is not hover-only.
- Header layout does not break with many admin-enabled categories.

## Phase 2 - Shared Storefront Design System

### Task 2.1 - Create Storefront Shell

Priority: P1  
Owner area: Layout  
Dependencies: Task 0.2

Scope:

- Create a shared `StorefrontShell` or layout wrapper.
- Standardize Header/Footer placement, `main` spacing, background, and header offset.
- Replace repeated page wrappers where practical.

Acceptance criteria:

- Storefront pages use consistent top spacing.
- Header overlap issues are reduced.
- Background token usage is consistent.

### Task 2.2 - Create Shared Page Hero

Priority: P1  
Owner area: Design system  
Dependencies: Task 2.1

Scope:

- Create `PageHero` with variants for commerce, editorial, support, legal, and auth.
- Support kicker, title, subtitle, image/background, and CTA slots.
- Replace old page-specific hero implementations gradually.

Acceptance criteria:

- Collections, about, contact, FAQ, size guide, shipping, careers, and terms pages use consistent hero structure.
- Hero spacing and typography are consistent across desktop and mobile.

### Task 2.3 - Create Shared Section Header

Priority: P1  
Owner area: Design system  
Dependencies: None

Scope:

- Create `SectionHeader` with optional kicker, title, subtitle, and action.
- Use it on homepage, collections, support pages, product sections, and policy pages.

Acceptance criteria:

- Section headings use one typography and spacing pattern.
- Overlong subtitles are shortened or removed.

### Task 2.4 - Create Shared Empty State

Priority: P1  
Owner area: Design system  
Dependencies: Task 0.3

Scope:

- Create `EmptyState` with title, description, primary CTA, secondary CTA, and optional icon.
- Use it for cart, wishlist, orders, collections, and search/no-products states.

Acceptance criteria:

- Empty states look consistent.
- All empty-state CTAs point to valid routes.

### Task 2.5 - Create Shared Form Components

Priority: P1  
Owner area: Forms  
Dependencies: Task 0.4

Scope:

- Create `FormField`, `FormTextarea`, `FormSelect`, `CheckboxField`, and form error/hint patterns.
- Replace one-off form styles in checkout, contact, auth, newsletter, review, and Q&A flows.

Acceptance criteria:

- Form labels, errors, hints, focus states, and disabled states are consistent.
- Inline form styles are removed from major storefront forms.

### Task 2.6 - Create Shared Badges And Trust Strip

Priority: P1  
Owner area: Commerce UI  
Dependencies: None

Scope:

- Create `StatusBadge` for order/product states.
- Create `TrustStrip` for COD, delivery, returns, and WhatsApp support.
- Use badges consistently across products, cart, checkout, orders, and product detail.

Acceptance criteria:

- Statuses are not styled ad hoc per page.
- Checkout and product detail show clear trust signals.

## Phase 3 - Page Refresh Tasks

### Task 3.1 - Refresh Collections Index

Priority: P1  
Owner area: Collections  
Dependencies: Tasks 1.1, 2.2, 2.3

Scope:

- Replace older collection hero/card styling with homepage-aligned category cards.
- Use admin category data for names, images, descriptions, SEO, and sort order.
- Replace `Garments` with better customer-facing labels where configured.

Acceptance criteria:

- Collections page visually matches the homepage direction.
- No hardcoded category fallback dominates the page when admin data exists.
- Category cards route to valid category pages.

### Task 3.2 - Improve Collection Listing Filters

Priority: P1  
Owner area: Collections/Product listing  
Dependencies: Task 2.5

Scope:

- Add mobile filter drawer.
- Add count, sort, active-filter chips, and clear filters.
- Make filters category-aware instead of always using generic sizes/fabrics.

Acceptance criteria:

- Mobile users can filter without scrolling through a long sidebar.
- Applied filters are visible and removable.
- Category-specific filters make sense for lawn, pret, hijab, bedding, and festive categories.

### Task 3.3 - Refactor Product Detail UI

Priority: P1  
Owner area: Product detail  
Dependencies: Tasks 2.5, 2.6

Scope:

- Split product detail into smaller UI components.
- Replace inline styles with CSS modules/shared components.
- Fix hardcoded breadcrumbs.
- Add trust strip near buy box.
- Improve size guide link and delivery/returns messaging.
- Replace native review preview `img` usage where appropriate.

Acceptance criteria:

- Product detail has consistent spacing, typography, and component styling.
- Breadcrumbs reflect actual product/category data.
- Buy box clearly communicates price, stock, size, color, COD, delivery, and return policy.

### Task 3.4 - Refresh Cart Page And Cart Drawer

Priority: P1  
Owner area: Cart  
Dependencies: Tasks 2.4, 2.6

Scope:

- Replace invalid continue-shopping routes.
- Align cart page and drawer with shared cards/buttons/empty states.
- Add better free-shipping progress styling.
- Add product recommendations or category chips if data is available.

Acceptance criteria:

- Cart and cart drawer feel visually connected.
- Empty cart CTA is valid.
- Summary and checkout CTA are clear on mobile.

### Task 3.5 - Refresh Checkout

Priority: P1  
Owner area: Checkout  
Dependencies: Tasks 2.5, 2.6

Scope:

- Add checkout step/progress context.
- Add trust strip.
- Normalize form fields.
- Remove broken icons and inline styles.
- Improve promo code success/error messaging.

Acceptance criteria:

- Checkout feels secure and simple.
- Form errors and loading states are consistent.
- COD and delivery expectations are visible before order submission.

### Task 3.6 - Refresh Wishlist

Priority: P2  
Owner area: Wishlist  
Dependencies: Tasks 2.4, 2.6

Scope:

- Align wishlist cards and empty states with shared components.
- Add item count and optional sort/grouping.
- Improve quick add/remove feedback.

Acceptance criteria:

- Wishlist UI matches product grid and cart styling.
- Empty state uses valid CTA and shared design.

### Task 3.7 - Refresh Orders

Priority: P2  
Owner area: Account/orders  
Dependencies: Tasks 2.4, 2.6

Scope:

- Replace invalid empty-state route.
- Use shared status badges.
- Add clearer order timeline or status explanation.
- Remove inline loading/link styles.

Acceptance criteria:

- Order statuses are clear and consistent.
- Empty orders page routes to valid shopping entry point.

### Task 3.8 - Refresh Login And Register

Priority: P2  
Owner area: Auth  
Dependencies: Tasks 2.2, 2.5

Scope:

- Merge duplicated auth styling.
- Fix broken register copy.
- Add brand-aligned auth page layout.
- Add concise trust/support copy.

Acceptance criteria:

- Login and register share one visual system.
- Auth pages match storefront typography and spacing.

### Task 3.9 - Refresh About Page Content And Design

Priority: P2  
Owner area: Content/Brand  
Dependencies: Tasks 0.2, 2.2

Scope:

- Rewrite about copy around Pakistani wardrobes, daily wear, lawn, pret, festive, and home rituals.
- Replace broken icons.
- Align hero and content cards with homepage.

Acceptance criteria:

- About page no longer uses generic luxury/couture language.
- Brand story matches current storefront positioning.

### Task 3.10 - Refresh Contact Page

Priority: P1  
Owner area: Support/forms  
Dependencies: Tasks 0.4, 2.5

Scope:

- Wire contact form to real backend or make it transparent as unavailable.
- Replace broken contact icons.
- Prioritize WhatsApp, order support, COD, delivery, and return questions.

Acceptance criteria:

- Contact form success only appears after real submission.
- Contact page is useful for customer support.

### Task 3.11 - Refresh Editorial Page

Priority: P2  
Owner area: Content/editorial  
Dependencies: Tasks 0.3, 2.2

Scope:

- Replace `#` article links.
- Make category filters functional or non-interactive.
- Normalize brand copy.
- Decide whether editorial is static content, CMS/admin content, or hidden until ready.

Acceptance criteria:

- No fake article links.
- Editorial cards either navigate to real pages or are presented as previews without misleading interaction.

### Task 3.12 - Refresh FAQ

Priority: P2  
Owner area: Support content  
Dependencies: Tasks 0.1, 2.2

Scope:

- Replace broken icons.
- Normalize brand copy.
- Reorganize FAQs around customer intents.
- Add links to shipping, size guide, contact, and WhatsApp where useful.

Acceptance criteria:

- FAQ answers are easy to scan.
- Icons render correctly.
- Support links route correctly.

### Task 3.13 - Refresh Size Guide

Priority: P2  
Owner area: Product support  
Dependencies: Tasks 0.1, 2.2

Scope:

- Fix measurement encoding.
- Improve mobile table readability with stacked cards.
- Link size guide from product detail size selector.
- Add category-specific guidance where possible.

Acceptance criteria:

- Size guide is readable on mobile.
- Measurements render correctly.
- Product page connects directly to relevant sizing help.

### Task 3.14 - Refresh Shipping And Returns

Priority: P1  
Owner area: Policy/support  
Dependencies: Tasks 0.1, 0.2, 2.2

Scope:

- Fix broken icons, dashes, and bullets.
- Normalize brand metadata.
- Use shared policy layout.
- Add concise summary cards for processing, delivery, COD, and returns.

Acceptance criteria:

- Policy page renders cleanly with no broken symbols.
- Return and delivery expectations are visible quickly.

### Task 3.15 - Refresh Terms And Privacy

Priority: P2  
Owner area: Legal/support  
Dependencies: Tasks 0.2, 2.2

Scope:

- Normalize brand and domain.
- Fix broken punctuation.
- Use shared legal/policy layout.
- Keep table of contents consistent with support pages.

Acceptance criteria:

- Legal page matches storefront support page styling.
- Brand/domain references are consistent.

### Task 3.16 - Refresh Careers

Priority: P3  
Owner area: Content/support  
Dependencies: Tasks 0.1, 0.2, 2.2

Scope:

- Fix broken icons and separators.
- Rewrite copy for a Pakistani e-commerce clothing brand.
- Confirm roles are current or hide stale openings.

Acceptance criteria:

- Careers page does not contain broken text.
- Roles and brand voice feel current.

### Task 3.17 - Refresh Coming Soon

Priority: P3  
Owner area: Marketing  
Dependencies: Tasks 2.2, 2.6

Scope:

- Align Coming Soon page with homepage hero and CTA style.
- Keep WhatsApp/pre-booking flow consistent with storefront support patterns.

Acceptance criteria:

- Coming Soon page feels like part of the same storefront.
- CTA and support messaging are consistent.

### Task 3.18 - Refresh Maintenance Page

Priority: P3  
Owner area: Utility pages  
Dependencies: Tasks 0.1, 0.2

Scope:

- Fix broken gear icon and broken French text.
- Normalize support email/domain.
- Rewrite older luxury copy.

Acceptance criteria:

- Maintenance page contains no broken symbols.
- Contact details match production support details.

## Phase 4 - Content And SEO Governance

### Task 4.1 - Add Category SEO Governance

Priority: P1  
Owner area: Admin/SEO  
Dependencies: Task 1.1

Scope:

- Add or verify category fields for meta title, meta description, Open Graph image, canonical slug, display label, nav label, hero copy, and visibility toggles.
- Make storefront pages consume these fields consistently.

Acceptance criteria:

- Category pages do not rely on generic fallback SEO when admin SEO exists.
- Header/nav labels can differ safely from SEO/page titles.

### Task 4.2 - Create Storefront Content Glossary

Priority: P2  
Owner area: Content  
Dependencies: Task 0.2

Scope:

- Define preferred category names and copy patterns.
- Document terms to avoid: `Garments`, overused `quiet luxury`, generic `premium fashion house`, and unsupported couture claims.
- Document preferred terms: `Lawn`, `Pret`, `Festive`, `Daily Wear`, `Daawat`, `Dupatta`, `Modest`, `Pakistani seasons`.

Acceptance criteria:

- New page copy follows one glossary.
- Homepage, footer, about, collections, and product support pages use aligned language.

### Task 4.3 - Decide Editorial Content Source

Priority: P2  
Owner area: Content/Admin  
Dependencies: Task 3.11

Scope:

- Choose static MD/TS content, admin-managed articles, or remove editorial until content exists.
- If admin-managed, define fields: title, slug, excerpt, category, image, status, publish date, SEO fields.

Acceptance criteria:

- Editorial page only shows real publishable articles.
- Article links are valid.

## Phase 5 - QA And Regression Checks

### Task 5.1 - Add Storefront Text Integrity Check

Priority: P1  
Owner area: Tooling  
Dependencies: Task 0.1

Scope:

- Add a script or documented command to scan for common mojibake patterns.
- Include storefront source and metadata files.

Acceptance criteria:

- Running the check fails or reports if broken encoded text returns.
- The check is documented for future UI/content work.

### Task 5.2 - Add Link Audit Checklist

Priority: P1  
Owner area: QA  
Dependencies: Task 0.3

Scope:

- Verify all storefront nav, footer, card, CTA, empty-state, breadcrumb, and support links.
- Include admin category enabled/disabled scenarios.

Acceptance criteria:

- No known dead customer-facing storefront links.
- Category visibility changes do not break header/footer.

### Task 5.3 - Responsive QA Pass

Priority: P1  
Owner area: QA/UI  
Dependencies: Phase 3 page refreshes

Scope:

- Test mobile, tablet, laptop, and large desktop widths.
- Verify header, mega menu, filters, product detail, cart drawer, checkout, tables, and policy pages.

Acceptance criteria:

- No horizontal overflow on storefront pages.
- Primary CTAs remain visible and usable on mobile.
- Sticky elements do not overlap header or content.

### Task 5.4 - Accessibility QA Pass

Priority: P1  
Owner area: QA/UI  
Dependencies: Tasks 1.3, 2.5

Scope:

- Test keyboard navigation.
- Verify focus states.
- Verify labels for forms and icon buttons.
- Check color contrast for badges, buttons, links, and muted text.

Acceptance criteria:

- Header, filters, cart drawer, product form, checkout, and auth flows are keyboard usable.
- Icon-only actions have accessible labels.

### Task 5.5 - Visual Consistency Review

Priority: P2  
Owner area: Design QA  
Dependencies: Phase 3 page refreshes

Scope:

- Compare homepage, collections, product, cart, checkout, auth, and support pages.
- Review typography, spacing, radius, shadows, backgrounds, CTA hierarchy, and empty states.

Acceptance criteria:

- Storefront pages look like one brand system.
- Page-level deviations are intentional, not accidental.

## Suggested Execution Order

1. Task 0.1 - Fix Broken Encoding Across Storefront
2. Task 0.2 - Standardize Brand Name And Domain
3. Task 0.3 - Fix Broken And Risky Links
4. Task 1.1 - Make Header Category Links Fully Admin-Controlled
5. Task 1.2 - Make Footer Collections Admin-Controlled
6. Task 2.1 - Create Storefront Shell
7. Task 2.2 - Create Shared Page Hero
8. Task 2.4 - Create Shared Empty State
9. Task 2.5 - Create Shared Form Components
10. Task 2.6 - Create Shared Badges And Trust Strip
11. Task 3.1 - Refresh Collections Index
12. Task 3.2 - Improve Collection Listing Filters
13. Task 3.3 - Refactor Product Detail UI
14. Task 3.5 - Refresh Checkout
15. Task 3.4 - Refresh Cart Page And Cart Drawer
16. Task 3.10 - Refresh Contact Page
17. Task 3.14 - Refresh Shipping And Returns
18. Task 3.8 - Refresh Login And Register
19. Task 3.9 - Refresh About Page Content And Design
20. Task 3.11 - Refresh Editorial Page
21. Task 3.12 - Refresh FAQ
22. Task 3.13 - Refresh Size Guide
23. Task 3.7 - Refresh Orders
24. Task 3.6 - Refresh Wishlist
25. Task 3.15 - Refresh Terms And Privacy
26. Task 3.16 - Refresh Careers
27. Task 3.17 - Refresh Coming Soon
28. Task 3.18 - Refresh Maintenance Page
29. Task 4.1 - Add Category SEO Governance
30. Task 4.2 - Create Storefront Content Glossary
31. Task 4.3 - Decide Editorial Content Source
32. Task 5.1 - Add Storefront Text Integrity Check
33. Task 5.2 - Add Link Audit Checklist
34. Task 5.3 - Responsive QA Pass
35. Task 5.4 - Accessibility QA Pass
36. Task 5.5 - Visual Consistency Review

## Completed In This Pass

- Task 0.1 - Fix Broken Encoding Across Storefront
- Task 0.2 - Standardize Brand Name And Domain
- Task 0.3 - Fix Broken And Risky Links
- Task 0.4 - Remove Fake Success Interactions
- Task 1.1 - Make Header Category Links Fully Admin-Controlled
- Task 1.2 - Make Footer Collections Admin-Controlled
- Task 1.3 - Improve Header Accessibility And Overflow
- Task 2.1 - Create Storefront Shell
- Task 2.2 - Create Shared Page Hero
- Task 2.3 - Create Shared Section Header
- Task 2.4 - Create Shared Empty State
- Task 2.5 - Create Shared Form Components
- Task 2.6 - Create Shared Badges And Trust Strip
- Task 3.1 - Refresh Collections Index
- Task 3.3 - Refactor Product Detail UI
- Task 3.6 - Refresh Wishlist
- Task 3.8 - Refresh Login And Register
- Task 3.9 - Refresh About Page Content And Design
- Task 3.10 - Refresh Contact Page
- Task 3.11 - Refresh Editorial Page
- Task 3.12 - Refresh FAQ
- Task 3.13 - Refresh Size Guide
- Task 3.14 - Refresh Shipping And Returns
- Task 3.15 - Refresh Terms And Privacy
- Task 3.16 - Refresh Careers
- Task 3.18 - Refresh Maintenance Page

## Additional Fixes Completed In This Pass

- `src/app/layout.tsx` metadata and social preview copy normalized
- `src/app/page.tsx` homepage metadata and visible copy cleaned up
- `src/app/collections/page.tsx` collection preview copy normalized
- `src/app/product/[slug]/ProductDetailClient.tsx` breadcrumb route corrected
- `src/app/product/[slug]/page.tsx` mock product copy normalized
- `src/app/checkout/CheckoutForm.tsx` checkout icons and promo text cleaned up
- `src/app/register/page.tsx` register subtitle normalized
- `src/app/product/[slug]/ProductDetailClient.tsx` breadcrumb, trust strip, and review glyphs cleaned up
- `src/app/product/[slug]/ProductDetailClient.module.css` trust strip styling added
- `src/components/auth/LoginForm.tsx` auth copy and trust strip refreshed
- `src/app/login/auth.module.css` auth trust strip styling added
- `src/app/wishlist/page.tsx` wishlist copy refreshed
- `src/app/collections/[slug]/page.tsx` category labels refreshed
