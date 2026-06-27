# Google Analytics Integration Plan

## Summary

Ayraa uses direct GA4 through `gtag.js`, loaded with `next/script` from a small client component mounted in the root layout. Analytics is consent-first, defaults to denied storage, and excludes `/admin` routes.

## Configuration

Add these public environment variables:

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GA_DEBUG=false
NEXT_PUBLIC_ANALYTICS_ENABLED=true
```

Tracking is disabled unless `NEXT_PUBLIC_ANALYTICS_ENABLED` is `true` and a measurement ID is configured.

## Implementation

- `src/lib/analytics.ts` contains typed GA helpers, ecommerce item mapping, consent helpers, route exclusion checks, and purchase deduplication.
- `src/components/analytics/GoogleAnalytics.tsx` initializes `dataLayer`, sets denied consent defaults, loads GA4 after hydration, and sends route-change page views only after consent.
- `src/components/analytics/AnalyticsConsentBanner.tsx` stores the visitor consent choice in `localStorage` and updates Google consent mode.
- `src/components/analytics/WebVitals.tsx` reports Next Web Vitals to GA4 as non-interaction events.
- `src/app/layout.tsx` mounts analytics components without making the root layout a client component.

## Event Coverage

- Page/navigation: `page_view`, `nav_click`, `mobile_menu_open`, `theme_toggle`, `footer_link_click`
- Product discovery/detail: `view_item_list`, `select_item`, `view_item`, `select_item_variant`, `product_image_view`, `accordion_open`, `related_product_click`, `ar_preview_open`
- Cart/checkout: `add_to_cart`, `remove_from_cart`, `view_cart`, `cart_quantity_change`, `free_shipping_progress`, `begin_checkout`, `add_shipping_info`, `add_payment_info`, `apply_promo`, `remove_promo`, `promo_validation_failed`, `purchase`, `order_failed`
- Wishlist/auth: `add_to_wishlist`, `remove_from_wishlist`, `wishlist_login_prompt`, `view_wishlist`, `login_start`, `login_success`, `register_start`, `register_success`, `logout`
- Engagement: `newsletter_signup`, `newsletter_error`, `whatsapp_click`, `contact_submit`, `question_submit`, `review_submit`, `review_image_upload`
- AR: `ar_preview_open`, `ar_start`, `ar_camera_permission_granted`, `ar_camera_permission_denied`, `ar_texture_loaded`, `ar_corner_set`, `ar_capture_download`, `ar_capture_share`, `ar_error`
- Diagnostics: `supabase_client_error` with sanitized categories only

## Data Rules

- Ecommerce events use GA4-compatible `items` payloads and `currency: "PKR"`.
- Product payloads include product ID, name, category, selected variant, unit price, quantity, discount, coupon, list name, and index where available.
- Analytics never sends customer email, phone, name, address, postal code, or Supabase user IDs.
- Purchase events use order ID as `transaction_id` and are deduplicated in `sessionStorage` and `localStorage`.

## Verification

Run:

```bash
npm run lint
npm run build
```

Manual checks:

- Before consent, no behavioral events are sent.
- Accepting consent sends one route page view and enables future events.
- Rejecting consent keeps analytics storage denied.
- Route changes send one `page_view`.
- `/admin` routes do not send page views or behavioral events.
- Product list/card, PDP, cart, checkout, wishlist, newsletter, WhatsApp, reviews/Q&A, AR, and Web Vitals events appear in GA DebugView with `NEXT_PUBLIC_GA_DEBUG=true`.
