import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { Header } from "@/components/storefront/Header/Header";
import { Footer } from "@/components/storefront/Footer/Footer";
import { createCacheClient } from "@/lib/supabase/cache-client";
import { Category, Product } from "@/types";
import { CollectionClient } from "./CollectionClient";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

// ─── Category name map (all slugs) ───────────────────────────────────────────
const CATEGORY_NAMES: Record<string, string> = {
  // Parent categories
  "lawn-prints": "Lawn Prints",
  "garments": "Garments",
  "bedding": "Bedding",
  "hijab-collection": "Hijab Collection",
  // Lawn sub-categories
  "lawn-3-piece": "Lawn 3-Piece",
  "lawn-2-piece": "Lawn 2-Piece",
  "lawn-ready-to-wear": "Lawn Ready to Wear",
  // Garments sub-categories
  "intimate-wear": "Intimate Wear",
  "sleep-wear": "Sleep Wear",
  // Bedding sub-categories
  "single-bedsheets": "Single Bed-sheets",
  "double-bedsheets": "Double Bed-sheets",
  // Hijab sub-categories
  "chiffon-hijabs": "Chiffon Hijabs",
  "printed-hijabs": "Printed Hijabs",
};

// ─── Parent → sub-category card data ─────────────────────────────────────────
const SUB_CATEGORIES: Record<string, { name: string; slug: string; image: string }[]> = {
  "lawn-prints": [
    { name: "3-Piece", slug: "lawn-3-piece", image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop&q=80" },
    { name: "2-Piece", slug: "lawn-2-piece", image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&auto=format&fit=crop&q=80" },
    { name: "Ready to Wear", slug: "lawn-ready-to-wear", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80" },
  ],
  "garments": [
    { name: "Intimate Wear", slug: "intimate-wear", image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&auto=format&fit=crop&q=80" },
    { name: "Sleep Wear", slug: "sleep-wear", image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80" },
  ],
  "bedding": [
    { name: "Single Bed-sheets", slug: "single-bedsheets", image: "https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=600&auto=format&fit=crop&q=80" },
    { name: "Double Bed-sheets", slug: "double-bedsheets", image: "https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=600&auto=format&fit=crop&q=80" },
  ],
  "hijab-collection": [
    { name: "Chiffon Hijabs", slug: "chiffon-hijabs", image: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=600&auto=format&fit=crop&q=80" },
    { name: "Printed Hijabs", slug: "printed-hijabs", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80" },
  ],
};

// ─── Mock products per sub-category (fallback when DB is empty) ──────────────
const MOCK_PRODUCTS: Record<string, Product[]> = {
  "lawn-3-piece": [
    {
      id: "p-l3-1", name: "Rose Garden 3-Piece", slug: "rose-garden-3-piece",
      description: "Exquisite rose garden print lawn 3-piece suit with embroidered dupatta.",
      price: 6500, compare_at_price: 7800, sku: "AYR-LWN-3P-01",
      category_id: "lawn-3-piece", is_active: true, is_featured: true,
      fabric: "Premium Lawn", color: "Rose Pink", includes: "Shirt, Dupatta, Trouser",
      care_instructions: "Machine wash cold", meta_title: null, meta_description: null,
      created_at: new Date().toISOString(),
      images: [{ id: "i-l3-1", product_id: "p-l3-1", url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop&q=80", alt_text: "Rose Garden 3-Piece", sort_order: 1, is_primary: true }],
      variants: [
        { id: "v-l3-1s", product_id: "p-l3-1", size: "S", stock_quantity: 20, is_available: true },
        { id: "v-l3-1m", product_id: "p-l3-1", size: "M", stock_quantity: 25, is_available: true },
        { id: "v-l3-1l", product_id: "p-l3-1", size: "L", stock_quantity: 15, is_available: true },
      ],
    },
  ],
  "lawn-2-piece": [
    {
      id: "p-l2-1", name: "Blush Garden 2-Piece", slug: "blush-garden-2-piece",
      description: "Delicate blush floral print lawn 2-piece set with embroidered neckline.",
      price: 4200, compare_at_price: 5500, sku: "AYR-LWN-2P-01",
      category_id: "lawn-2-piece", is_active: true, is_featured: true,
      fabric: "Premium Lawn", color: "Blush Pink", includes: "Shirt, Dupatta",
      care_instructions: "Machine wash cold", meta_title: null, meta_description: null,
      created_at: new Date().toISOString(),
      images: [{ id: "i-l2-1", product_id: "p-l2-1", url: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&auto=format&fit=crop&q=80", alt_text: "Blush Garden 2-Piece", sort_order: 1, is_primary: true }],
      variants: [
        { id: "v-l2-1s", product_id: "p-l2-1", size: "S", stock_quantity: 20, is_available: true },
        { id: "v-l2-1m", product_id: "p-l2-1", size: "M", stock_quantity: 25, is_available: true },
      ],
    },
  ],
  "lawn-ready-to-wear": [
    {
      id: "p-lrw-1", name: "Ivory Drape Lawn Set", slug: "ivory-drape-lawn-set",
      description: "Ready-stitched ivory lawn ensemble — just wear and go.",
      price: 5800, compare_at_price: null, sku: "AYR-LWN-RW-01",
      category_id: "lawn-ready-to-wear", is_active: true, is_featured: true,
      fabric: "Lawn Cotton", color: "Ivory", includes: "Stitched Shirt, Dupatta",
      care_instructions: "Machine wash gentle", meta_title: null, meta_description: null,
      created_at: new Date().toISOString(),
      images: [{ id: "i-lrw-1", product_id: "p-lrw-1", url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80", alt_text: "Ivory Drape Lawn Set", sort_order: 1, is_primary: true }],
      variants: [
        { id: "v-lrw-1s", product_id: "p-lrw-1", size: "S", stock_quantity: 10, is_available: true },
        { id: "v-lrw-1m", product_id: "p-lrw-1", size: "M", stock_quantity: 12, is_available: true },
        { id: "v-lrw-1l", product_id: "p-lrw-1", size: "L", stock_quantity: 8, is_available: true },
      ],
    },
  ],
  "intimate-wear": [
    {
      id: "p-iw-1", name: "Olive Linen Set", slug: "olive-linen-set",
      description: "Soft, breathable linen set crafted for all-day comfort.",
      price: 2800, compare_at_price: 3500, sku: "AYR-IW-01",
      category_id: "intimate-wear", is_active: true, is_featured: true,
      fabric: "Premium Linen", color: "Olive Green", includes: "Top, Bottom",
      care_instructions: "Hand wash cold", meta_title: null, meta_description: null,
      created_at: new Date().toISOString(),
      images: [{ id: "i-iw-1", product_id: "p-iw-1", url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80", alt_text: "Olive Linen Set", sort_order: 1, is_primary: true }],
      variants: [
        { id: "v-iw-1s", product_id: "p-iw-1", size: "S", stock_quantity: 12, is_available: true },
        { id: "v-iw-1m", product_id: "p-iw-1", size: "M", stock_quantity: 15, is_available: true },
      ],
    },
  ],
  "sleep-wear": [
    {
      id: "p-sw-1", name: "Noir Silk Pyjama Set", slug: "noir-silk-pyjama-set",
      description: "Luxuriously soft silk pyjama set for the perfect night's rest.",
      price: 3200, compare_at_price: null, sku: "AYR-SW-01",
      category_id: "sleep-wear", is_active: true, is_featured: true,
      fabric: "Raw Silk", color: "Midnight Black", includes: "Top, Trouser",
      care_instructions: "Dry clean only", meta_title: null, meta_description: null,
      created_at: new Date().toISOString(),
      images: [{ id: "i-sw-1", product_id: "p-sw-1", url: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&auto=format&fit=crop&q=80", alt_text: "Noir Silk Pyjama Set", sort_order: 1, is_primary: true }],
      variants: [
        { id: "v-sw-1s", product_id: "p-sw-1", size: "S", stock_quantity: 10, is_available: true },
        { id: "v-sw-1m", product_id: "p-sw-1", size: "M", stock_quantity: 12, is_available: true },
      ],
    },
  ],
  "single-bedsheets": [
    {
      id: "p-sbs-1", name: "Ivory Satin Single Bed-sheet", slug: "ivory-satin-single-bedsheet",
      description: "Silky smooth 300-thread-count satin single bed-sheet set with pillow cover.",
      price: 2800, compare_at_price: null, sku: "AYR-BED-SGL-01",
      category_id: "single-bedsheets", is_active: true, is_featured: true,
      fabric: "Satin Cotton", color: "Ivory White", includes: "Bed-sheet, 1 Pillow Cover",
      care_instructions: "Gentle machine wash", meta_title: null, meta_description: null,
      created_at: new Date().toISOString(),
      images: [{ id: "i-sbs-1", product_id: "p-sbs-1", url: "https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=600&auto=format&fit=crop&q=80", alt_text: "Ivory Satin Single Bed-sheet", sort_order: 1, is_primary: true }],
      variants: [{ id: "v-sbs-1", product_id: "p-sbs-1", size: "Standard", stock_quantity: 30, is_available: true }],
    },
  ],
  "double-bedsheets": [
    {
      id: "p-dbs-1", name: "Noir Damask Double Bed-sheet", slug: "noir-damask-double-bedsheet",
      description: "Elegant damask-pattern 400-thread-count double bed-sheet set with two pillow covers.",
      price: 4500, compare_at_price: 5800, sku: "AYR-BED-DBL-01",
      category_id: "double-bedsheets", is_active: true, is_featured: true,
      fabric: "Egyptian Cotton", color: "Charcoal Black", includes: "Bed-sheet, 2 Pillow Covers",
      care_instructions: "Machine wash 30°C", meta_title: null, meta_description: null,
      created_at: new Date().toISOString(),
      images: [{ id: "i-dbs-1", product_id: "p-dbs-1", url: "https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=600&auto=format&fit=crop&q=80", alt_text: "Noir Damask Double Bed-sheet", sort_order: 1, is_primary: true }],
      variants: [{ id: "v-dbs-1", product_id: "p-dbs-1", size: "Standard", stock_quantity: 20, is_available: true }],
    },
  ],
  "chiffon-hijabs": [
    {
      id: "p-ch-1", name: "Midnight Chiffon Hijab", slug: "midnight-chiffon-hijab",
      description: "Lightweight chiffon hijab in a solid midnight black shade — drapes beautifully.",
      price: 750, compare_at_price: null, sku: "AYR-HIJ-CH-01",
      category_id: "chiffon-hijabs", is_active: true, is_featured: true,
      fabric: "Pure Chiffon", color: "Midnight Black", includes: "Hijab Only",
      care_instructions: "Hand wash", meta_title: null, meta_description: null,
      created_at: new Date().toISOString(),
      images: [{ id: "i-ch-1", product_id: "p-ch-1", url: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=600&auto=format&fit=crop&q=80", alt_text: "Midnight Chiffon Hijab", sort_order: 1, is_primary: true }],
      variants: [{ id: "v-ch-1", product_id: "p-ch-1", size: "One Size", stock_quantity: 50, is_available: true }],
    },
  ],
  "printed-hijabs": [
    {
      id: "p-ph-1", name: "Floral Garden Printed Hijab", slug: "floral-garden-printed-hijab",
      description: "Soft jersey printed hijab in a vibrant floral garden print. Stays in place all day.",
      price: 850, compare_at_price: null, sku: "AYR-HIJ-PRN-01",
      category_id: "printed-hijabs", is_active: true, is_featured: true,
      fabric: "Jersey", color: "Multi-colour Floral", includes: "Hijab Only",
      care_instructions: "Hand wash", meta_title: null, meta_description: null,
      created_at: new Date().toISOString(),
      images: [{ id: "i-ph-1", product_id: "p-ph-1", url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80", alt_text: "Floral Garden Printed Hijab", sort_order: 1, is_primary: true }],
      variants: [{ id: "v-ph-1", product_id: "p-ph-1", size: "One Size", stock_quantity: 50, is_available: true }],
    },
  ],
};

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

type SubCategoryCard = Pick<Category, "id" | "name" | "slug"> & {
  image_url: string | null;
};

import { unstable_cache } from "next/cache";

// ... metadata ...
// ... CATEGORY_NAMES ...
// ... SUB_CATEGORIES ...
// ... MOCK_PRODUCTS ...

const getCachedCategory = unstable_cache(
  async (slug: string) => {
    try {
      const supabase = createCacheClient();
      const { data: categoryData, error } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", slug)
        .single();

      if (categoryData && !error) {
        return categoryData;
      }

      if (slug === "luxury-pret") {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("categories")
          .select("*")
          .eq("slug", "pret")
          .single();

        if (fallbackData && !fallbackError) {
          return fallbackData;
        }
      }
    } catch (err) {
      console.error("Error loading category from Supabase:", err);
    }
    return null;
  },
  ["category-by-slug"],
  { revalidate: 300 }
);

const getCachedSubCategories = unstable_cache(
  async (categoryId: string) => {
    const supabase = createCacheClient();
    const { data: dbSubs } = await supabase
      .from("categories")
      .select("*")
      .eq("parent_id", categoryId)
      .order("sort_order", { ascending: true });
    return dbSubs || [];
  },
  ["subcategories-by-parent-id"],
  { revalidate: 300 }
);

const getCachedActiveCategoryIds = unstable_cache(
  async () => {
    const supabase = createCacheClient();
    const activeCategoryIds = new Set<string>();
    const { data: prodCats } = await supabase
      .from("products")
      .select("category_id, variants:product_variants!inner(*)")
      .eq("is_active", true)
      .gt("variants.stock_quantity", 0);
    if (prodCats) {
      prodCats.forEach((p) => {
        if (p.category_id) activeCategoryIds.add(p.category_id);
      });
    }
    return Array.from(activeCategoryIds);
  },
  ["active-category-ids-list"],
  { revalidate: 300 }
);

const getCachedCategoryProducts = unstable_cache(
  async (categoryId: string) => {
    const supabase = createCacheClient();
    const { data: productsData } = await supabase
      .from("products")
      .select("*, category:categories(*), images:product_images(*), variants:product_variants!inner(*)")
      .eq("category_id", categoryId)
      .eq("is_active", true)
      .gt("variants.stock_quantity", 0);
    return productsData || [];
  },
  ["category-products-by-id"],
  { revalidate: 300 }
);

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCachedCategory(slug);
  const name = category?.name || CATEGORY_NAMES[slug] || "Collection";
  const title = category?.meta_title || name;
  const desc = category?.meta_description || category?.description || `Explore our premium range of ${name.toLowerCase()} at Ayraa.`;

  return {
    title,
    description: desc,
    alternates: { canonical: `/collections/${slug}` },
    openGraph: { title: `${title} | Ayraa`, description: desc, type: "website" },
    twitter: { card: "summary_large_image", title: `${title} | Ayraa`, description: desc },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  const category = await getCachedCategory(slug);
  const categoryName = category?.name || CATEGORY_NAMES[slug];

  // 404 for completely unknown slugs
  if (!categoryName) {
    notFound();
  }

  const baseUrl = "https://ayraa.pk";
  const breadcrumbItems = [
    { name: "Home", item: "/" },
    { name: "Collections", item: "/collections" },
    { name: categoryName, item: `/collections/${slug}` },
  ];

  // Fetch sub-categories dynamically from database
  let subCategories: SubCategoryCard[] = [];
  if (category) {
    try {
      const dbSubs = await getCachedSubCategories(category.id);
      if (dbSubs && dbSubs.length > 0) {
        subCategories = dbSubs as SubCategoryCard[];
      }
    } catch { /* ignore */ }
  }

  // Fallback to hardcoded SUB_CATEGORIES if database returns none
  if (subCategories.length === 0 && SUB_CATEGORIES[slug]) {
    subCategories = SUB_CATEGORIES[slug].map((sub, idx) => ({
      id: `mock-sub-${idx}`,
      name: sub.name,
      slug: sub.slug,
      image_url: sub.image,
    }));
  }

  // Fetch active product category IDs
  const activeCategoryIds = new Set<string>();
  try {
    const prodCatsList = await getCachedActiveCategoryIds();
    if (prodCatsList) {
      prodCatsList.forEach((catId) => {
        activeCategoryIds.add(catId);
      });
    }
  } catch (err) {
    console.error("Failed to query active category IDs:", err);
  }

  // Filter sub-categories to only show those containing products
  if (subCategories.length > 0) {
    subCategories = subCategories.filter((sub) => activeCategoryIds.has(sub.id));
  }

  // ── Parent category → show sub-category card grid ──────────────────────────
  if (subCategories.length > 0) {
    return (
      <div className="flex flex-col min-h-screen bg-bg transition-colors duration-500 ease-out">
        <BreadcrumbJsonLd items={breadcrumbItems} baseUrl={baseUrl} />
        <Header />
        <main className="grow pt-20 md:pt-16 pb-20">
          <div className="container" style={{ maxWidth: "1400px", marginInline: "auto", paddingInline: "var(--space-8)" }}>
            {/* Heading */}
            <div style={{ textAlign: "center", marginBottom: "64px" }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-label)", fontWeight: "var(--weight-bold)", letterSpacing: "var(--tracking-widest)", textTransform: "uppercase", color: "var(--color-gold)", marginBottom: "var(--space-3)" }}>
                Browse
              </p>
              <h1 style={{ fontFamily: "var(--font-headline)", fontSize: "clamp(28px, 5vw, 48px)", color: "var(--color-on-surface)", letterSpacing: "var(--tracking-tight)", marginBottom: "var(--space-4)" }}>
                {categoryName}
              </h1>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body-md)", color: "var(--color-on-surface-sub)", maxWidth: "480px", marginInline: "auto" }}>
                {category?.description || `Select a style from our ${categoryName} range.`}
              </p>
            </div>

            {/* Sub-category card grid */}
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${subCategories.length}, 1fr)`, gap: "28px" }}
              className="sub-category-grid">
              {subCategories.map((sub) => (
                <Link
                  key={sub.slug}
                  href={`/collections/${sub.slug}`}
                  style={{
                    position: "relative", display: "block", height: "480px",
                    overflow: "hidden", border: "1px solid var(--color-border-subtle)",
                    textDecoration: "none", transition: "border-color var(--duration-normal) var(--ease-out)",
                  }}
                  className="sub-category-card"
                >
                  <Image
                    src={sub.image_url || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop&q=80"}
                    alt={sub.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    style={{ objectFit: "cover", transition: "transform 800ms ease-out" }}
                    className="sub-cat-img"
                  />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(28,27,27,0.92) 0%, rgba(28,27,27,0.1) 60%, transparent 100%)", zIndex: 10 }} />
                  <div style={{ position: "absolute", bottom: "32px", left: "32px", right: "32px", zIndex: 20 }}>
                    <h2 style={{ fontFamily: "var(--font-headline)", fontSize: "var(--text-title-lg)", color: "#e9c349", marginBottom: "var(--space-2)" }}>
                      {sub.name}
                    </h2>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-label)", fontWeight: "var(--weight-bold)", textTransform: "uppercase", letterSpacing: "var(--tracking-widest)", color: "rgba(251,249,248,0.8)" }}>
                      Shop Now →
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Sub-category grid responsive styles injected inline */}
            <style>{`
              @media (max-width: 767px) {
                .sub-category-grid { grid-template-columns: 1fr !important; }
              }
              .sub-category-card:hover { border-color: var(--color-gold) !important; }
              .sub-category-card:hover .sub-cat-img { transform: scale(1.05); }
            `}</style>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Sub-category → show product listing ────────────────────────────────────
  let products: Product[] = [];

  try {
    if (category) {
      const productsData = await getCachedCategoryProducts(category.id);
      if (productsData && productsData.length > 0) {
        products = productsData as Product[];
      }
    }

    if (products.length === 0) {
      products = MOCK_PRODUCTS[slug] || [];
    }
  } catch (err) {
    console.error("Error loading category page:", err);
    products = MOCK_PRODUCTS[slug] || [];
  }

  if (!products || products.length === 0) {
    // Still render an empty state rather than a hard 404
    products = MOCK_PRODUCTS[slug] || [];
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg transition-colors duration-500 ease-out">
      <BreadcrumbJsonLd items={breadcrumbItems} baseUrl={baseUrl} />
      <Header />
      <main className="grow pt-20 md:pt-16">
        <CollectionClient
          initialProducts={products}
          categoryName={categoryName}
          categorySlug={slug}
        />
      </main>
      <Footer />
    </div>
  );
}
