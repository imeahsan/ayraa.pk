import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { Header } from "@/components/storefront/Header/Header";
import { Footer } from "@/components/storefront/Footer/Footer";
import { createClient } from "@/lib/supabase/server";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { Product, Category } from "@/types";
import { AllProductsClient } from "./AllProductsClient";
import styles from "./collections.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "All Collections",
  description: "Explore Ayraa's full range — Lawn Prints, Garments, Bedding and Hijab Collections. Premium quality crafted for every lifestyle.",
  alternates: {
    canonical: "/collections",
  },
  openGraph: {
    title: "All Collections | Ayraa",
    description: "Explore Ayraa's full range — Lawn Prints, Garments, Bedding and Hijab Collections.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "All Collections | Ayraa",
    description: "Explore Ayraa's full range — Lawn Prints, Garments, Bedding and Hijab Collections.",
  },
};

const MOCK_CATEGORIES = [
  { name: "Lawn Prints",      slug: "lawn-prints",      image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop&q=80" },
  { name: "Garments",         slug: "garments",         image: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=600&auto=format&fit=crop&q=80" },
  { name: "Bedding",          slug: "bedding",          image: "https://images.unsplash.com/photo-1539008885128-40d24b2d7015?w=600&auto=format&fit=crop&q=80" },
  { name: "Hijab Collection", slug: "hijab-collection", image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&auto=format&fit=crop&q=80" },
];

const MOCK_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Noir Silk Blouse",
    slug: "noir-silk-blouse",
    description: "A sleek black ready-to-wear blouse crafted from premium raw silk, featuring structured tailoring.",
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
    description: "A flowing ivory white maxi dress with intricate hand-embroidered details and keyhole necklines.",
    price: 32000,
    compare_at_price: null,
    sku: "AYR-IVO-02",
    category_id: "pret",
    is_active: true,
    is_featured: true,
    fabric: "Georgette Chiffon",
    color: "Ivory White",
    includes: "Maxi Dress, Slip",
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
  {
    id: "p3",
    name: "Olive Linen Set",
    slug: "olive-linen-set",
    description: "A modern relaxed-fit linen two-piece set in a rich olive tone with buttoned cuffs.",
    price: 21000,
    compare_at_price: 25000,
    sku: "AYR-OLI-03",
    category_id: "ready-to-wear",
    is_active: true,
    is_featured: true,
    fabric: "Premium Linen",
    color: "Olive Green",
    includes: "Shirt, Trousers",
    care_instructions: "Hand wash cold",
    meta_title: null,
    meta_description: null,
    created_at: new Date().toISOString(),
    images: [
      {
        id: "img3",
        product_id: "p3",
        url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80",
        alt_text: "Olive Linen Set",
        sort_order: 1,
        is_primary: true,
      },
    ],
  },
  {
    id: "p5",
    name: "Midnight Chiffon Suit",
    slug: "midnight-chiffon-suit",
    description: "Exude effortless elegance in this hand-embellished midnight chiffon suit. Featuring intricate detailing and a flowing silhouette.",
    price: 85000,
    compare_at_price: 95000,
    sku: "AYR-MCF-05",
    category_id: "formal",
    is_active: true,
    is_featured: true,
    fabric: "Pure Chiffon",
    color: "Midnight Black",
    includes: "Shirt, Dupatta, Trousers, Inner",
    care_instructions: "Dry clean only",
    meta_title: null,
    meta_description: null,
    created_at: new Date().toISOString(),
    images: [
      {
        id: "img5",
        product_id: "p5",
        url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80",
        alt_text: "Midnight Chiffon Suit",
        sort_order: 1,
        is_primary: true,
      },
    ],
  },
];

export default async function CollectionsPage() {
  let products: Product[] = [];
  let categories: Category[] = [];

  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("products")
      .select("*, category:categories(*), images:product_images(*)")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(12);

    if (error || !data || data.length === 0) {
      products = MOCK_PRODUCTS;
    } else {
      products = data as Product[];
    }
  } catch (err) {
    console.error("Error fetching products:", err);
    products = MOCK_PRODUCTS;
  }

  // Fetch active category IDs
  const activeCategoryIds = new Set<string>();
  try {
    const { data: prodCats } = await supabase
      .from("products")
      .select("category_id")
      .eq("is_active", true);
    if (prodCats) {
      prodCats.forEach((p) => {
        if (p.category_id) activeCategoryIds.add(p.category_id);
      });
    }
  } catch (err) {
    console.error("Failed to query active category IDs:", err);
  }

  const hasProductsRecursively = (catId: string, allCats: Category[]): boolean => {
    if (activeCategoryIds.has(catId)) return true;
    const children = allCats.filter((c) => c.parent_id === catId);
    return children.some((child) => hasProductsRecursively(child.id, allCats));
  };

  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (!error && data && data.length > 0) {
      const allCats = data as Category[];
      categories = allCats
        .filter((cat) => cat.parent_id === null)
        .filter((cat) => hasProductsRecursively(cat.id, allCats));
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
        image_url: c.image
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
      image_url: c.image
    }));
  }

  const getCategoryImage = (cat: Category) => {
    if (cat.image_url) return cat.image_url;
    if (cat.slug === "lawn-prints") return "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop&q=80";
    if (cat.slug === "garments") return "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=600&auto=format&fit=crop&q=80";
    if (cat.slug === "bedding") return "https://images.unsplash.com/photo-1539008885128-40d24b2d7015?w=600&auto=format&fit=crop&q=80";
    if (cat.slug === "hijab-collection") return "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&auto=format&fit=crop&q=80";
    return "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=100&auto=format&fit=crop&q=80";
  };

  const baseUrl = "https://ayraacollection.vercel.app";
  const breadcrumbItems = [
    { name: "Home", item: "/" },
    { name: "Collections", item: "/collections" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-bg transition-colors duration-500 ease-out">
      <BreadcrumbJsonLd items={breadcrumbItems} baseUrl={baseUrl} />
      <Header />
      
      <main className="grow pt-20 md:pt-16">
        {/* Banner */}
        <section className={styles.banner}>
          <div className={styles.bannerContent}>
            <span className={styles.bannerSub}>Heritage & Pret</span>
            <h1 className={styles.bannerTitle}>All Collections</h1>
            <p className={styles.bannerDesc}>
              Indulge in our carefully curated garments, merging centuries of hand-crafted
              heritage with contemporary lines.
            </p>
          </div>
        </section>

        {/* Categories Grid */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Shop by Category</h2>
          <div className={styles.categoryGrid}>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/collections/${cat.slug}`}
                className={styles.categoryCard}
              >
                <div className={styles.categoryImageWrapper}>
                  <Image
                    src={getCategoryImage(cat)}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className={styles.categoryImage}
                  />
                  <div className={styles.categoryOverlay} />
                  <span className={styles.categoryTitle}>{cat.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Product Grid */}
        <section className={styles.productSection}>
          <h2 className={styles.sectionTitle}>All Products</h2>
          <AllProductsClient initialProducts={products} gridClassName={styles.productGrid} />
        </section>
      </main>

      <Footer />
    </div>
  );
}
