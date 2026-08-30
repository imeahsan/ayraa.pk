<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Storefront UI Design System & Architecture Rules

Always follow these design rules and guidelines across all storefront pages, layouts, and components:

## 1. Typography & Type Scale
- **Body & Controls**: `Inter` (`--font-body`, `--font-inter`).
- **Headings**: `Playfair Display` (`--font-headline`, `--font-playfair`).
- **Strict Scale**:
  - `11px` (`--text-2xs`) / `12px` (`--text-xs`)
  - `14px` (`--text-sm`)
  - `16px` (`--text-base`)
  - `18px` (`--text-md`)
  - `20px` (`--text-lg`)
  - `22px` (`--text-xl`)
  - `24px` (`--text-2xl`)
  - `28px` (`--text-3xl`)
  - `32px` (`--text-4xl`)
  - `40px` (`--text-5xl`)
  - `48px` (`--text-display`)

## 2. Dark Mode Palette (Obsidian Noir)
- Dark theme must be noticeably darker, richer, and less washed out while maintaining high contrast readability:
  - Deep Base: `--color-bg: #0c0b0b;`
  - Elevated Surfaces: `--color-bg-elevated: #141313;`
  - Card Surfaces: `--color-bg-card: #181717;`
  - Hover States: `--color-bg-hover: #222020;`
  - High-Contrast Text: `--color-on-surface: #fbf9f8;`
  - Brand Accents: Champagne Gold `--color-gold: #e9c349;` / `--color-gold-bright: #f0cf65;`

## 3. Border Radius & Editorial Sharpness
- **Consistent Rule**: Prefer `border-radius: 0` on cards, containers, and sections for a sharp, luxury editorial magazine look.
- Small radius (`8–12px`) applied only to standalone images where needed.
- **Buttons**: Must have a smaller radius than their height (default `--radius-btn: 4px;`), never pill-shaped unless explicitly intended.
- **Badges/Tags**: Consistent `--radius-btn: 4px;` without excessive roundness.

## 4. Shadows & Lighting Direction
- No inconsistent lateral (left/right) shadows.
- All shadows must come from a subtle top-down ambient light source so the shadow falls naturally downward (`0 4px 12px ...`, `0 8px 24px ...`).

## 5. Layout & Content Container
- Consistent content container enforced across the storefront:
  - `--container-content: 1180px;` (Max `1200px`).
  - Navigation, hero, sections, collection listings, and footer must align to this exact boundary with consistent mobile/tablet padding (`16px` to `24px`).

## 6. Navigation & Far-Right Action CTA
- Brand logo: Retain authentic brand logo structure, presented elegantly in Playfair Display with tracking and gold accent.
- Top navigation far-right position is strictly reserved for the primary CTA:
  - **Logged Out**: Prominent gold/yellow **Login** CTA button (`.loginCtaBtn`).
  - **Logged In**: Replaced in the exact same spot with the user avatar badge / account dropdown menu.

## 7. Product Cards & Image Animations
- Product cards must feature refined hover image transitions:
  - Secondary image fades and scales (`scale(1.04)`) seamlessly over primary image.
  - Image must fully cover card bounds (`object-fit: cover`, `inset: 0`) with zero white gaps or background flashes.
  - Non-hovered cards must remain stable and never shift or reset state.

## 8. Query Resilience & Non-Empty Featured Section
- **Featured Products**: Must never display an empty state. If manual featured products are $< 4$, query automatically falls back to top available in-stock active products across categories.
- **Category Collections**: All parent collections (Lawn Prints, Garments, Bedding, Hijab Collection, etc.) must remain visible in responsive grid layouts without arbitrary category exclusion.
