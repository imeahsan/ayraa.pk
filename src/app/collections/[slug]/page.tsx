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

export const revalidate = 300;

export async function generateStaticParams() {
  const slugs = [
    "lawn-prints",
    "garments",
    "bedding",
    "hijab-collection",
    "lawn-3-piece",
    "lawn-2-piece",
    "lawn-ready-to-wear",
    "intimate-wear",
    "sleep-wear",
    "single-bedsheets",
    "double-bedsheets",
    "chiffon-hijabs",
    "printed-hijabs",
    "night-wears"
  ];
  return slugs.map((slug) => ({ slug }));
}

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
  { revalidate: 300, tags: ["categories"] }
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
  { revalidate: 300, tags: ["categories"] }
);

const getCachedActiveCategoryIds = unstable_cache(
  async () => {
    const supabase = createCacheClient();
    const activeCategoryIds = new Set<string>();
    const { data: prodCats } = await supabase
      .from("products")
      .select("category_id")
      .eq("is_active", true)
;
    if (prodCats) {
      prodCats.forEach((p) => {
        if (p.category_id) activeCategoryIds.add(p.category_id);
      });
    }
    return Array.from(activeCategoryIds);
  },
  ["active-category-ids-list"],
  { revalidate: 300, tags: ["categories", "products"] }
);

const getCachedCategoryProducts = unstable_cache(
  async (categoryId: string) => {
    const supabase = createCacheClient();
    const { data: productsData } = await supabase
      .from("products")
      .select("*, category:categories(*), images:product_images(*), variants:product_variants(*)")
      .eq("category_id", categoryId)
      .eq("is_active", true);
    return productsData || [];
  },
  ["category-products-by-id"],
  { revalidate: 300, tags: ["categories", "products"] }
);

function CollectionComingSoon({
  categoryName,
  category,
}: {
  categoryName: string;
  category: Category | null;
}) {
  const previewImage =
    category?.image_url ||
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&auto=format&fit=crop&q=80";

  return (
    <main className="grow pt-20 md:pt-16">
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          minHeight: "calc(100vh - 96px)",
          background:
            "radial-gradient(circle at top, rgba(233, 195, 73, 0.12) 0%, rgba(28, 27, 27, 0.95) 48%, #161514 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(180deg, rgba(22,21,20,0.3) 0%, rgba(22,21,20,0.92) 78%), url(${previewImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.42,
            transform: "scale(1.04)",
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            maxWidth: "1180px",
            marginInline: "auto",
            paddingInline: "var(--space-6)",
            paddingBlock: "clamp(72px, 12vw, 120px)",
          }}
        >
          <div
            style={{
              maxWidth: "760px",
              marginInline: "auto",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              alignItems: "center",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 18px",
                border: "1px solid rgba(233, 195, 73, 0.45)",
                borderRadius: "999px",
                fontFamily: "var(--font-body)",
                fontSize: "11px",
                fontWeight: "var(--weight-bold)",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: "var(--color-gold)",
                backgroundColor: "rgba(233, 195, 73, 0.06)",
              }}
            >
              Launching Soon
            </span>
            <h1
              style={{
                margin: 0,
                fontFamily: "var(--font-headline)",
                fontSize: "clamp(34px, 7vw, 72px)",
                lineHeight: 1.05,
                letterSpacing: "var(--tracking-tight)",
                color: "#fbf9f8",
                textTransform: "uppercase",
              }}
            >
              {categoryName}
            </h1>
            <p
              style={{
                margin: 0,
                maxWidth: "620px",
                fontFamily: "var(--font-body)",
                fontSize: "clamp(15px, 2vw, 18px)",
                lineHeight: 1.8,
                color: "rgba(251, 249, 248, 0.78)",
              }}
            >
              {category?.description ||
                `This collection is being prepared and will be launched soon. Check back shortly for the full edit.`}
            </p>
            <div
              style={{
                width: "min(560px, 100%)",
                marginTop: "10px",
                padding: "22px 24px",
                border: "1px solid rgba(255,255,255,0.08)",
                backgroundColor: "rgba(255,255,255,0.03)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "12px",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "11px",
                    fontWeight: "var(--weight-bold)",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "rgba(251, 249, 248, 0.72)",
                  }}
                >
                  Collection Status
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "12px",
                    color: "var(--color-gold)",
                  }}
                >
                  Curating the launch
                </span>
              </div>
              <div
                style={{
                  height: "4px",
                  width: "100%",
                  backgroundColor: "rgba(255,255,255,0.08)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: "72%",
                    height: "100%",
                    background:
                      "linear-gradient(90deg, rgba(233,195,73,0.75) 0%, rgba(233,195,73,1) 100%)",
                    boxShadow: "0 0 18px rgba(233, 195, 73, 0.35)",
                  }}
                />
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: "14px",
                flexWrap: "wrap",
                justifyContent: "center",
                marginTop: "8px",
              }}
            >
              <Link
                href="/collections"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "48px",
                  padding: "0 24px",
                  border: "1px solid var(--color-gold)",
                  color: "var(--color-gold)",
                  textDecoration: "none",
                  textTransform: "uppercase",
                  letterSpacing: "var(--tracking-wider)",
                  fontFamily: "var(--font-body)",
                  fontSize: "12px",
                  fontWeight: "var(--weight-bold)",
                  backgroundColor: "rgba(233, 195, 73, 0.06)",
                }}
              >
                Explore Other Collections
              </Link>
              <Link
                href="/contact"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "48px",
                  padding: "0 24px",
                  border: "1px solid rgba(255,255,255,0.14)",
                  color: "#fbf9f8",
                  textDecoration: "none",
                  textTransform: "uppercase",
                  letterSpacing: "var(--tracking-wider)",
                  fontFamily: "var(--font-body)",
                  fontSize: "12px",
                  fontWeight: "var(--weight-bold)",
                  backgroundColor: "rgba(255,255,255,0.02)",
                }}
              >
                Contact Ayraa
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCachedCategory(slug);
  const name = category?.name || CATEGORY_NAMES[slug] || "Collection";
  const title = category?.is_coming_soon
    ? category?.meta_title || `${name} Coming Soon | Ayraa Collection`
    : category?.meta_title || collectionSeoTitle(name);
  const desc = truncateSeoText(
    category?.meta_description ||
      category?.description ||
      (category?.is_coming_soon
        ? `${name} is launching soon at Ayraa Collection. Explore the collection preview and check back for the full launch.`
        : undefined),
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

  if (category?.is_coming_soon) {
    return (
      <div className="flex flex-col min-h-screen bg-bg transition-colors duration-500 ease-out">
        <BreadcrumbJsonLd items={breadcrumbItems} baseUrl={baseUrl} />
        <Header />
        <CollectionComingSoon categoryName={categoryName} category={category} />
        <Footer />
      </div>
    );
  }

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
