import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/storefront/Header/Header";
import { Footer } from "@/components/storefront/Footer/Footer";
import { createClient } from "@/lib/supabase/server";
import { Product, Category } from "@/types";
import styles from "./page.module.css";
import { FeaturedSlider } from "@/components/storefront/FeaturedSlider/FeaturedSlider";

export const dynamic = "force-dynamic";

// Mock products for fallback if database is empty/not seeded yet
const MOCK_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Noir Silk Blouse",
    slug: "noir-silk-blouse",
    description: "A sleek black ready-to-wear blouse crafted from premium raw silk.",
    price: 18500,
    compare_at_price: 22000,
    sku: "AYR-NOI-01",
    category_id: "cat-pret",
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
      {
        id: "img1-alt",
        product_id: "p1",
        url: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&auto=format&fit=crop&q=80",
        alt_text: "Noir Silk Blouse back",
        sort_order: 2,
        is_primary: false,
      },
    ],
  },
  {
    id: "p2",
    name: "Ivory Drape Dress",
    slug: "ivory-drape-dress",
    description: "A flowing ivory white maxi dress with intricate hand-embroidered details.",
    price: 32000,
    compare_at_price: null,
    sku: "AYR-IVO-02",
    category_id: "cat-luxury-pret",
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
    description: "A modern relaxed-fit linen co-ord set in a rich olive tone.",
    price: 21000,
    compare_at_price: 25000,
    sku: "AYR-OLI-03",
    category_id: "cat-pret",
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
    id: "p4",
    name: "Terra Geometric Tunic",
    slug: "terra-geometric-tunic",
    description: "A lightweight lawn tunic featuring abstract geo prints in warm terracotta.",
    price: 9500,
    compare_at_price: null,
    sku: "AYR-TER-04",
    category_id: "cat-lawn",
    is_active: true,
    is_featured: true,
    fabric: "Lawn Cotton",
    color: "Terracotta",
    includes: "Tunic Only",
    care_instructions: "Gentle machine wash",
    meta_title: null,
    meta_description: null,
    created_at: new Date().toISOString(),
    images: [
      {
        id: "img4",
        product_id: "p4",
        url: "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=600&auto=format&fit=crop&q=80",
        alt_text: "Terra Geometric Tunic",
        sort_order: 1,
        is_primary: true,
      },
    ],
  },
];

export default async function Home() {
  let featuredProducts: Product[] = [];
  let categories: Category[] = [];

  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("products")
      .select("*, category:categories(*), images:product_images(*)")
      .eq("is_featured", true)
      .eq("is_active", true);

    if (error || !data || data.length === 0) {
      featuredProducts = MOCK_PRODUCTS;
    } else {
      featuredProducts = data as Product[];
    }
  } catch (err) {
    console.error("Error fetching featured products:", err);
    featuredProducts = MOCK_PRODUCTS;
  }

  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true);

    if (!error && data) {
      categories = data as Category[];
    }
  } catch (err) {
    console.error("Error fetching categories for homepage:", err);
  }

  const pretCategory = categories.find((c) => c.slug === "pret");
  const formalCategory = categories.find((c) => c.slug === "formal");
  const rtwCategory = categories.find((c) => c.slug === "ready-to-wear");

  const luxuryPretImage = pretCategory?.image_url || "https://images.unsplash.com/photo-1539008885128-40d24b2d7015?w=800&auto=format&fit=crop&q=80";
  const eidEditImage = formalCategory?.image_url || "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=800&auto=format&fit=crop&q=80";
  const newArrivalsImage = rtwCategory?.image_url || "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&auto=format&fit=crop&q=80";

  return (
    <div className="flex flex-col min-h-screen bg-bg transition-colors duration-500 ease-out">
      <Header />
      
      <main className="grow pt-20 md:pt-16">
        {/* Hero Section */}
        <section className={styles.hero} id="hero-section">
          <Image
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80"
            alt="The Summer Lawn Collection"
            fill
            priority
            className="object-cover object-[center_30%] opacity-75 transition-opacity duration-500 ease-out"
          />
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            <span className={styles.heroBadge} id="hero-badge">New Arrival</span>
            <h1 className={styles.heroTitle}>The Summer Lawn Collection</h1>
            <Link href="/collections/ready-to-wear" className={styles.heroBtn}>
              Shop Now
            </Link>
          </div>
        </section>

        {/* Curated Edits Section */}
        <section className={styles.section} id="curated-edits">
          <div className="container">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Curated Edits</h2>
              <p className={styles.sectionDesc}>
                Discover our latest collections designed for the modern muse.
              </p>
            </div>

            <div className={styles.curatedGrid}>
              {/* Eid Edit */}
              <Link href="/collections/eid-edit" className={styles.curatedCard}>
                <div className={styles.curatedImageWrapper}>
                  <Image
                    src={eidEditImage}
                    alt="Eid Edit"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className={styles.curatedImage}
                  />
                  <div className={styles.curatedOverlay} />
                  <div className={styles.curatedContent}>
                    <h3 className={styles.curatedTitle}>Eid Edit</h3>
                    <span className={styles.curatedLink}>Explore &rarr;</span>
                  </div>
                </div>
              </Link>

              {/* Luxury Pret */}
              <Link href="/collections/luxury-pret" className={styles.curatedCard}>
                <div className={styles.curatedImageWrapper}>
                  <Image
                    src={luxuryPretImage}
                    alt="Luxury Pret"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className={styles.curatedImage}
                  />
                  <div className={styles.curatedOverlay} />
                  <div className={styles.curatedContent}>
                    <h3 className={styles.curatedTitle}>Luxury Pret</h3>
                    <span className={styles.curatedLink}>Explore &rarr;</span>
                  </div>
                </div>
              </Link>

              {/* New Arrivals */}
              <Link href="/collections/ready-to-wear" className={styles.curatedCard}>
                <div className={styles.curatedImageWrapper}>
                  <Image
                    src={newArrivalsImage}
                    alt="New Arrivals"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className={styles.curatedImage}
                  />
                  <div className={styles.curatedOverlay} />
                  <div className={styles.curatedContent}>
                    <h3 className={styles.curatedTitle}>New Arrivals</h3>
                    <span className={styles.curatedLink}>Explore &rarr;</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Featured Pieces */}
        <section className={styles.sectionElevated} id="featured-pieces">
          <div className="container">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Featured Pieces</h2>
              <p className={styles.sectionDesc}>
                Curated essentials for your wardrobe.
              </p>
            </div>
            <FeaturedSlider products={featuredProducts} />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
