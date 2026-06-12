# Ayra E-Commerce — Workspace Rules

## Project Overview
Premium Eastern fashion e-commerce for the **Ayra** brand. Built with Next.js 15 (App Router), Supabase, and the **Aureate Noir** design system from Stitch AI.

## Technology Stack
- **Framework**: Next.js 15 (App Router) with TypeScript
- **Styling**: Vanilla CSS with CSS Custom Properties (design tokens). NO Tailwind.
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Package Manager**: npm
- **Node**: >= 20
- **Fonts**: Playfair Display (headlines) + Montserrat (body/labels) via `next/font/google`
- **Payment**: Cash on Delivery (COD) only
- **Currency**: PKR (Pakistani Rupees)
- **Deployment**: Vercel

## File Structure Rules
- Use the App Router (`app/` directory) exclusively — no `pages/` directory
- One component per file, named with PascalCase (e.g., `ProductCard.tsx`)
- CSS Modules for component-scoped styles (`ComponentName.module.css`)
- Global styles in `app/globals.css` (design tokens, resets, typography)
- Supabase client utilities in `lib/supabase/`
- Type definitions in `types/`
- Reusable hooks in `hooks/`
- Server actions in `app/actions/`
- Storefront components in `components/storefront/`
- Admin components in `components/admin/`

## Code Style
- Prefer Server Components by default; use `'use client'` only when needed (interactivity, hooks, browser APIs)
- Use `async/await` for all Supabase queries
- All images via `next/image` with proper `width`, `height`, and `alt`
- SEO metadata via `generateMetadata()` or static `metadata` exports
- Structured data (JSON-LD) on product and category pages
- All interactive elements must have unique `id` attributes
- Format PKR prices with `Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' })`

## CSS Rules
- Use CSS Custom Properties for ALL design tokens (colors, typography, spacing)
- Mobile-first responsive design with `min-width` breakpoints:
  - `--bp-mobile`: 390px
  - `--bp-tablet`: 768px
  - `--bp-desktop`: 1024px
  - `--bp-wide`: 1440px
- No utility-first CSS frameworks (no Tailwind)
- Use `clamp()` for fluid typography
- Animations via CSS `@keyframes` and `transition` — no animation libraries
- Admin panel: dark sidebar (#1a1a1a), light content (#f5f5f5), gold accents (#D4AF37)

## Design System: Aureate Noir
- **Primary**: Charcoal Black `#000000`
- **Surface**: Pearl White `#f9f9f9`
- **Accent**: Opulent Gold `#D4AF37`
- **Headlines**: Playfair Display (serif)
- **Body/Labels**: Montserrat (sans-serif)
- **Shapes**: 8px default radius, luxury editorial aesthetic
- **Elevation**: Tonal layering, no heavy shadows

## Supabase Conventions
- Browser client: `createBrowserClient()` from `@supabase/ssr`
- Server client: `createServerClient()` with cookie handling
- Admin routes: check `user.role === 'admin'` in middleware
- RLS: public read on products/categories, user-scoped orders/wishlists
- Storage buckets: `product-images`, `category-images`, `brand-assets`

## Component Patterns
- Each component folder contains: `ComponentName.tsx` + `ComponentName.module.css`
- Loading states: use CSS skeleton animations, not spinners
- Error states: graceful fallback UI with retry option
- Empty states: illustration + call-to-action
