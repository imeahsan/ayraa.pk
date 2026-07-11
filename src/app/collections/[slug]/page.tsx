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
import { ItemListJsonLd } from "@/components/seo/ItemListJsonLd";
import { absoluteUrl, collectionSeoTitle, getSiteUrl, truncateSeoText } from "@/lib/seo";

export const dynamic = "force-dynamic";

// ─── Category name map (all slugs) ───────────────────────────────────────────
const CATEGORY_NAMES: Record<string, string> = {
  // Parent categories
  "lawn-prints": "Lawn",
  "garments": "Pret",
  "bedding": "Home",
  "hijab-collection": "Hijabs",
  // Lawn sub-categories
  "lawn-3-piece": "Lawn 3-Piece",
  "lawn-2-piece": "Lawn 2-Piece",
  "lawn-ready-to-wear": "Lawn Pret",
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

// Mock fallbacks removed

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

type SubCategoryCard = Pick<Category, "id" | "name" | "slug"> & {
  image_url: string | null;
};

import { unstable_cache } from "next/cache";



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
  const title = category?.meta_title || collectionSeoTitle(name);
  const desc = truncateSeoText(
    category?.meta_description || category?.description,
    `Shop ${name.toLowerCase()} at Ayraa Collection. Explore Pakistani wardrobe edits with COD and nationwide delivery.`
  );
  const image = category?.image_url ? absoluteUrl(category.image_url) : undefined;
  const canonical = `/collections/${slug}`;

  return {
    title,
    description: desc,
    alternates: { canonical },
    openGraph: {
      title,
      description: desc,
      url: absoluteUrl(canonical),
      type: "website",
      images: image ? [{ url: image, alt: name }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: image ? [image] : [],
    },
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

  const baseUrl = getSiteUrl();
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
        <ItemListJsonLd
          name={`${categoryName} subcategories`}
          baseUrl={baseUrl}
          items={subCategories.map((sub) => ({
            name: sub.name,
            url: `/collections/${sub.slug}`,
          }))}
        />
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

  } catch (err) {
    console.error("Error loading category page:", err);
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg transition-colors duration-500 ease-out">
      <BreadcrumbJsonLd items={breadcrumbItems} baseUrl={baseUrl} />
      <ItemListJsonLd
        name={`${categoryName} products`}
        baseUrl={baseUrl}
        items={products.map((product) => ({
          name: product.name,
          url: `/product/${product.slug}`,
        }))}
      />
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
