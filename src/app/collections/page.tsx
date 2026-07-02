import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { Header } from "@/components/storefront/Header/Header";
import { Footer } from "@/components/storefront/Footer/Footer";
import { createCacheClient } from "@/lib/supabase/cache-client";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { ItemListJsonLd } from "@/components/seo/ItemListJsonLd";
import { Product, Category } from "@/types";
import { AllProductsClient } from "./AllProductsClient";
import styles from "./collections.module.css";
import { unstable_cache } from "next/cache";
import { DEFAULT_OG_IMAGE, absoluteUrl, getSiteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "All Collections | Ayraa Collection",
  description:
    "Explore Ayraa's lawn, pret, festive, and home edits crafted for Pakistani seasons.",
  alternates: {
    canonical: "/collections",
  },
  openGraph: {
    title: "All Collections | Ayraa Collection",
    description: "Explore Ayraa's lawn, pret, festive, and home edits crafted for Pakistani seasons.",
    url: "/collections",
    images: [{ url: absoluteUrl(DEFAULT_OG_IMAGE), alt: "Ayraa collections" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "All Collections | Ayraa Collection",
    description: "Explore Ayraa's lawn, pret, festive, and home edits crafted for Pakistani seasons.",
    images: [absoluteUrl(DEFAULT_OG_IMAGE)],
  },
};

const MOCK_CATEGORIES = [
  { name: "Lawn", slug: "lawn", image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop&q=80" },
  { name: "Pret", slug: "pret", image: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=600&auto=format&fit=crop&q=80" },
  { name: "Festive", slug: "festive", image: "https://images.unsplash.com/photo-1539008885128-40d24b2d7015?w=600&auto=format&fit=crop&q=80" },
  { name: "Home", slug: "home", image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&auto=format&fit=crop&q=80" },
];

const MOCK_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Noir Silk Blouse",
    slug: "noir-silk-blouse",
    description: "A sleek pret blouse crafted from premium raw silk.",
    price: 18500,
    compare_at_price: 22000,
    sku: "AYR-NOI-01",
    category_id: "pret",
    is_active: true,
    is_featured: true,
    fabric: "Raw Silk",
    color: "Black",
    includes: "Blouse Only",
    care_instructions: "Dry clean only",
    meta_title: null,
    meta_description: null,
    created_at: new Date().toISOString(),
    images: [
      {
        id: "img1",
        product_id: "p1",
        url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80",
        alt_text: "Noir Silk Blouse",
        sort_order: 1,
        is_primary: true,
      },
    ],
  },
  {
    id: "p2",
    name: "Ivory Drape Dress",
    slug: "ivory-drape-dress",
    description: "A flowing ivory dress with hand-finished detailing.",
    price: 32000,
    compare_at_price: null,
    sku: "AYR-IVO-02",
    category_id: "festive",
    is_active: true,
    is_featured: true,
    fabric: "Georgette Chiffon",
    color: "Ivory White",
    includes: "Dress, Slip",
    care_instructions: "Dry clean only",
    meta_title: null,
    meta_description: null,
    created_at: new Date().toISOString(),
    images: [
      {
        id: "img2",
        product_id: "p2",
        url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80",
        alt_text: "Ivory Drape Dress",
        sort_order: 1,
        is_primary: true,
      },
    ],
  },
];

const getCachedCollectionsProducts = unstable_cache(
  async () => {
    const supabase = createCacheClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, category:categories(*), images:product_images(*), variants:product_variants!inner(*)")
      .eq("is_active", true)
      .gt("variants.stock_quantity", 0)
      .order("created_at", { ascending: false })
      .limit(12);
    if (error) throw error;
    return (data || []) as Product[];
  },
  ["collections-products-limit-12"],
  { revalidate: 300, tags: ["products"] }
);

const getCachedCollectionsCategories = unstable_cache(
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

    const { data, error } = await supabase.from("categories").select("*").order("sort_order", { ascending: true });
    if (error || !data) throw error || new Error("Failed to load categories");

    const allCats = data as Category[];
    const hasProductsRecursively = (catId: string): boolean => {
      if (activeCategoryIds.has(catId)) return true;
      const children = allCats.filter((c) => c.parent_id === catId);
      return children.some((child) => hasProductsRecursively(child.id));
    };

    return allCats.filter((cat) => cat.parent_id === null).filter((cat) => hasProductsRecursively(cat.id));
  },
  ["collections-categories-filtered"],
  { revalidate: 300, tags: ["categories"] }
);

export default async function CollectionsPage() {
  let products: Product[] = [];
  let categories: Category[] = [];

  try {
    const data = await getCachedCollectionsProducts();
    products = data.length > 0 ? data : MOCK_PRODUCTS;
  } catch (err) {
    console.error("Error fetching products:", err);
    products = MOCK_PRODUCTS;
  }

  try {
    const data = await getCachedCollectionsCategories();
    if (data && data.length > 0) {
      categories = data;
    } else {
      categories = MOCK_CATEGORIES.map((c, idx) => ({
        id: `mock-cat-${idx}`,
        name: c.name,
        slug: c.slug,
        description: "",
        parent_id: null,
        sort_order: idx + 1,
        is_active: true,
        created_at: new Date().toISOString(),
        image_url: c.image,
      }));
    }
  } catch (err) {
    console.error("Error fetching categories:", err);
    categories = MOCK_CATEGORIES.map((c, idx) => ({
      id: `mock-cat-${idx}`,
      name: c.name,
      slug: c.slug,
      description: "",
      parent_id: null,
      sort_order: idx + 1,
      is_active: true,
      created_at: new Date().toISOString(),
      image_url: c.image,
    }));
  }

  const getCategoryImage = (cat: Category) => {
    if (cat.image_url) return cat.image_url;
    if (cat.slug === "lawn") return "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop&q=80";
    if (cat.slug === "pret") return "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=600&auto=format&fit=crop&q=80";
    if (cat.slug === "festive") return "https://images.unsplash.com/photo-1539008885128-40d24b2d7015?w=600&auto=format&fit=crop&q=80";
    if (cat.slug === "home") return "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&auto=format&fit=crop&q=80";
    return "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=100&auto=format&fit=crop&q=80";
  };

  const baseUrl = getSiteUrl();
  const breadcrumbItems = [
    { name: "Home", item: "/" },
    { name: "Collections", item: "/collections" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-bg transition-colors duration-500 ease-out">
      <BreadcrumbJsonLd items={breadcrumbItems} baseUrl={baseUrl} />
      <ItemListJsonLd
        name="Ayraa collections"
        baseUrl={baseUrl}
        items={categories.map((cat) => ({
          name: cat.name,
          url: `/collections/${cat.slug}`,
        }))}
      />
      <ItemListJsonLd
        name="Ayraa products"
        baseUrl={baseUrl}
        items={products.map((product) => ({
          name: product.name,
          url: `/product/${product.slug}`,
        }))}
      />
      <Header />

      <main className="grow pt-20 md:pt-16">
        <section className={styles.banner}>
          <div className={styles.bannerContent}>
            <span className={styles.bannerSub}>Pakistani Wardrobe</span>
            <h1 className={styles.bannerTitle}>All Collections</h1>
            <p className={styles.bannerDesc}>
              Browse lawn, pret, festive, and home edits made for Pakistani seasons, daawats, and everyday dressing.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Browse the Wardrobe</h2>
          <div className={styles.categoryGrid}>
            {categories.map((cat) => (
              <Link key={cat.id} href={`/collections/${cat.slug}`} className={styles.categoryCard}>
                <div className={styles.categoryImageWrapper}>
                  <Image
                    src={getCategoryImage(cat)}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className={styles.categoryImage}
                  />
                  <div className={styles.categoryOverlay} />
                  <span className={styles.categoryTitle}>{cat.header_label?.trim() || cat.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.productSection}>
          <h2 className={styles.sectionTitle}>All Products</h2>
          <AllProductsClient initialProducts={products} gridClassName={styles.productGrid} />
        </section>
      </main>

      <Footer />
    </div>
  );
}
