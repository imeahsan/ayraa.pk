# Image Caching and Optimization

This project uses two image-delivery layers:

1. Supabase Storage stores the original uploaded files.
2. Next.js `Image` optimizes and serves images through `/_next/image`.

The result is that storefront visitors normally download a resized WebP image instead of the original upload.

## Next.js image optimization

The settings are in [`next.config.ts`](./next.config.ts):

```ts
images: {
  formats: ["image/webp"],
  minimumCacheTTL: 86400,
  qualities: [75],
}
```

- `formats: ["image/webp"]` asks Next.js to generate WebP responses when the browser supports WebP.
- `qualities: [75]` limits the configured optimization quality to 75, reducing file size while retaining good catalog quality.
- `minimumCacheTTL: 86400` keeps an optimized image cached for at least 24 hours. The cache is held by the Next.js deployment/CDN, depending on the hosting provider.
- Supabase Storage, Unsplash, and Placehold are allow-listed as remote image sources.

Storefront components use `next/image` with `fill` and `sizes`. The `sizes` value tells the browser which rendered width to request, so a product card does not download a desktop-sized image on a phone.

## Loading behavior

Product cards use responsive loading rules:

- The first four products can load eagerly and receive high fetch priority; remaining products are lazy-loaded.
- Other catalog images use lazy loading and load as they approach the viewport.
- Hover/secondary product images are lazy-loaded separately.
- Product detail main images load eagerly because they are immediately visible.
- Product detail thumbnails use a small `120px` size hint.
- The first hero slide is prioritized; the remaining slides are allowed to load normally.

This reduces the number of images downloaded during the initial page load while keeping the visible content responsive.

## Supabase Storage caching

New product, collection cover, review, AR texture, and AR capture uploads use long-lived cache metadata. Catalog and collection cover uploads use:

```ts
cacheControl: "31536000"
```

That is one year. Upload paths include a timestamp and random suffix, for example:

```text
product-id/timestamp-random-id.jpg
categories/category-id/timestamp-random-id.jpg
```

The filenames are therefore versioned. Replacing an image creates a new URL instead of reusing the old URL, which makes long-lived caching safe. Removed product images and old collection covers are also removed from Supabase Storage by the admin forms. AR texture replacements upload a new version and remove superseded variants after the database points to the new asset.

## Request flow

```text
Product image URL in Supabase
        |
        v
next/image requests /_next/image with width and quality
        |
        v
Next.js fetches the source, converts/resizes it to WebP
        |
        v
Optimized result is cached and reused for later requests
```

The browser cache, the Next.js image cache, and the hosting provider CDN can all reduce repeated downloads. The exact edge-cache duration depends on the deployment platform, but Next.js will not use an optimized result for less than the configured 24-hour minimum.

## What cache invalidation affects

Product and category data cache tags are revalidated when catalog records change. This updates which image URL the storefront receives. Image files themselves are handled through versioned URLs, so changing an image does not require purging the old optimized image cache: the new URL produces a new optimization-cache key.

If an image is overwritten at the exact same URL outside the admin forms, stale versions may remain cached until the cache lifetime expires. Do not overwrite public image files in place; upload a new versioned file instead.

## Current limitations

- Uploads are not compressed before they reach Supabase Storage; the original file remains the source asset.
- Next.js optimization happens when an image variant is requested for the first time, so the first request for a new width can be slower.
- Local preview/object URLs are temporary browser URLs and do not use the public storage cache policy until the file is uploaded.
- `next/image` optimizes delivery, but it does not reduce the number of image records or image URLs returned by a Supabase query. Query selection and pagination still matter for database performance.

## Recommended operating rules

- Keep upload filenames unique and never replace a public image in place.
- Prefer `next/image` for storefront images.
- Set an accurate `sizes` value whenever using a responsive `fill` image.
- Use eager/high-priority loading only for above-the-fold images.
- Keep original uploads reasonably sized; WebP delivery does not reduce Supabase storage usage for the originals.
