import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { Header } from "@/components/storefront/Header/Header";
import { Footer } from "@/components/storefront/Footer/Footer";
import { createClient } from "@/lib/supabase/server";
import { Product, Category } from "@/types";
import styles from "./page.module.css";
import { FeaturedSlider } from "@/components/storefront/FeaturedSlider/FeaturedSlider";
import { NewsletterCTA } from "@/components/storefront/NewsletterCTA/NewsletterCTA";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ayraa Collection — Premium Eastern Luxury Wear",
  description:
    "Discover Ayraa's curated collection of premium lawn prints, pret, bedding and hijab essentials. Handcrafted heritage meets contemporary elegance.",
  openGraph: {
    title: "Ayraa Collection — Premium Eastern Luxury Wear",
    description:
      "Discover Ayraa's curated collection of premium lawn prints, pret, bedding and hijab essentials.",
    type: "website",
  },
};

// ─── Fallback mock data ────────────────────────────────────────────────────────
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

const FALLBACK_CATEGORIES = [
  { id: "c1", name: "Lawn Prints", slug: "lawn-prints", description: null, image_url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80", parent_id: null, sort_order: 1, is_active: true, created_at: "" },
  { id: "c2", name: "Garments", slug: "garments", description: null, image_url: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=800&auto=format&fit=crop&q=80", parent_id: null, sort_order: 2, is_active: true, created_at: "" },
  { id: "c3", name: "Bedding", slug: "bedding", description: null, image_url: "https://images.unsplash.com/photo-1539008885128-40d24b2d7015?w=800&auto=format&fit=crop&q=80", parent_id: null, sort_order: 3, is_active: true, created_at: "" },
  { id: "c4", name: "Hijab Collection", slug: "hijab-collection", description: null, image_url: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&auto=format&fit=crop&q=80", parent_id: null, sort_order: 4, is_active: true, created_at: "" },
] as Category[];

// Value pillars for brand story section
const VALUE_PILLARS = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    title: "Handcrafted Heritage",
    desc: "Each piece is woven from centuries-old Eastern traditions, preserving craftsmanship with every stitch.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    title: "Nationwide Delivery",
    desc: "Fast, secure doorstep delivery to every corner of Pakistan — so elegance always reaches you.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    title: "Premium Fabrics",
    desc: "Only the finest lawns, chiffons, silk, and satin — curated for quality that you can feel.",
  },
];

export default async function Home() {
  const supabase = await createClient();

  // ── Featured products ──────────────────────────────
  let featuredProducts: Product[] = [];
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*, category:categories(*), images:product_images(*)")
      .eq("is_featured", true)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    featuredProducts = !error && data && data.length > 0 ? (data as Product[]) : MOCK_PRODUCTS;
  } catch {
    featuredProducts = MOCK_PRODUCTS;
  }

  // ── New arrivals (latest 8) ────────────────────────
  let newArrivals: Product[] = [];
  try {
    const { data } = await supabase
      .from("products")
      .select("*, category:categories(*), images:product_images(*)")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(8);
    if (data && data.length > 0) newArrivals = data as Product[];
  } catch { /* ignore */ }

  // ── Sale products ──────────────────────────────────
  let saleProducts: Product[] = [];
  try {
    const { data } = await supabase
      .from("products")
      .select("*, category:categories(*), images:product_images(*)")
      .eq("is_on_sale", true)
      .eq("is_active", true);
    if (data) saleProducts = data as Product[];
  } catch { /* ignore */ }

  // ── Active parent categories for mosaic ───────────
  let displayCategories: Category[] = FALLBACK_CATEGORIES;
  try {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .is("parent_id", null)
      .order("sort_order", { ascending: true })
      .limit(6);
    if (data && data.length > 0) displayCategories = data as Category[];
  } catch { /* ignore */ }

  // ── Testimonials / recent reviews ─────────────────
  let testimonials: {
    id: string;
    rating: number;
    comment: string | null;
    reviewer_name: string | null;
    product?: { name: string; slug: string } | null;
  }[] = [];
  try {
    const { data } = await supabase
      .from("product_reviews")
      .select("id, rating, comment, reviewer_name, product:products(name, slug)")
      .order("created_at", { ascending: false })
      .limit(6);
    if (data && data.length > 0) testimonials = data as unknown as typeof testimonials;
  } catch { /* ignore */ }

  // ── Category image helper ──────────────────────────
  const fallbackImgs: Record<string, string> = {
    "lawn-prints": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80",
    "garments": "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=800&auto=format&fit=crop&q=80",
    "bedding": "https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=800&auto=format&fit=crop&q=80",
    "hijab-collection": "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&auto=format&fit=crop&q=80",
  };
  const getCatImg = (cat: Category) =>
    cat.image_url ||
    fallbackImgs[cat.slug] ||
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80";

  return (
    <div className="flex flex-col min-h-screen bg-bg transition-colors duration-500 ease-out">
      <Header />

      <main className="grow pt-20 md:pt-16">

        {/* ──────── HERO ──────────────────────────────────── */}
        <section className={styles.hero} id="hero-section">
          <Image
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&auto=format&fit=crop&q=85"
            alt="Ayraa Summer Collection"
            fill
            priority
            sizes="100vw"
            className={styles.heroImg}
          />
          {/* Gradient overlays */}
          <div className={styles.heroOverlayTop} />
          <div className={styles.heroOverlayBot} />

          <div className={styles.heroContent}>
            <span className={styles.heroBadge} id="hero-badge">Summer 2025</span>
            <h1 className={styles.heroTitle}>
              New Lawn Prints<br />
              <em className={styles.heroTitleItalic}>Summer Collection</em>
            </h1>
            <p className={styles.heroSub}>
              Heritage craftsmanship. Contemporary elegance.
            </p>
            <div className={styles.heroActions}>
              <Link href="/collections/lawn-prints" className={styles.heroBtn}>
                Shop Collection
              </Link>
              <Link href="/collections" className={styles.heroBtnGhost}>
                Explore All
              </Link>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className={styles.scrollIndicator} aria-hidden="true">
            <span className={styles.scrollLine} />
          </div>
        </section>

        {/* ──────── SHOP BY CATEGORY ──────────────────────── */}
        <section className={styles.section} id="shop-by-category">
          <div className={styles.sectionHeader}>
            <span className={styles.overline}>Explore</span>
            <h2 className={styles.sectionTitle}>Shop by Category</h2>
            <p className={styles.sectionDesc}>
              From summer lawn prints to cosy bedding — every corner of Ayraa, curated for you.
            </p>
          </div>

          <div className={styles.mosaicGrid}>
            {displayCategories.slice(0, 4).map((cat, i) => (
              <Link
                key={cat.id}
                href={`/collections/${cat.slug}`}
                className={`${styles.mosaicCard} ${i === 0 ? styles.mosaicCardHero : ""}`}
              >
                <div className={styles.mosaicImgWrapper}>
                  <Image
                    src={getCatImg(cat)}
                    alt={cat.name}
                    fill
                    sizes={i === 0 ? "(max-width:767px) 100vw, 50vw" : "(max-width:767px) 100vw, 25vw"}
                    className={styles.mosaicImg}
                  />
                </div>
                <div className={styles.mosaicOverlay} />
                <div className={styles.mosaicContent}>
                  <h3 className={styles.mosaicTitle}>{cat.name}</h3>
                  <span className={styles.mosaicCta}>Explore →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ──────── FEATURED PIECES ───────────────────────── */}
        <section className={styles.sectionElevated} id="featured-pieces">
          <div className="container">
            <div className={styles.sectionHeader}>
              <span className={styles.overline}>Curated</span>
              <h2 className={styles.sectionTitle}>Featured Pieces</h2>
              <p className={styles.sectionDesc}>
                Handpicked essentials — timeless, refined, yours.
              </p>
            </div>
            <FeaturedSlider products={featuredProducts} autoPlay={true} />
            <div className={styles.sectionCta}>
              <Link href="/collections" className={styles.textCta}>
                View All Products →
              </Link>
            </div>
          </div>
        </section>

        {/* ──────── BRAND STORY ───────────────────────────── */}
        <section className={styles.brandSection} id="brand-story">
          <div className={styles.brandGrid}>
            {/* Editorial image */}
            <div className={styles.brandImgWrapper}>
              <Image
                src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=900&auto=format&fit=crop&q=80"
                alt="Ayraa heritage craftsmanship"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className={styles.brandImg}
              />
              <div className={styles.brandImgOverlay} />
              <div className={styles.brandImgBadge}>
                <span>Est. 2018</span>
              </div>
            </div>

            {/* Value pillars */}
            <div className={styles.brandContent}>
              <span className={styles.overline}>Why Ayraa</span>
              <h2 className={styles.brandTitle}>
                Woven with<br />
                <em>Purpose & Pride</em>
              </h2>
              <p className={styles.brandDesc}>
                At Ayraa, every thread tells a story. We bridge the gap between centuries-old
                craftsmanship and modern sensibility — creating garments that honour heritage
                while dressing today.
              </p>

              <div className={styles.pillars}>
                {VALUE_PILLARS.map((pillar, i) => (
                  <div key={i} className={styles.pillar}>
                    <div className={styles.pillarIcon}>{pillar.icon}</div>
                    <div>
                      <h4 className={styles.pillarTitle}>{pillar.title}</h4>
                      <p className={styles.pillarDesc}>{pillar.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link href="/about" className={styles.brandLink}>
                Our Story →
              </Link>
            </div>
          </div>
        </section>

        {/* ──────── NEW ARRIVALS ───────────────────────────── */}
        {newArrivals.length > 0 && (
          <section className={styles.section} id="new-arrivals">
            <div className="container">
              <div className={styles.sectionHeaderRow}>
                <div>
                  <span className={styles.overline}>Just In</span>
                  <h2 className={styles.sectionTitle}>New Arrivals</h2>
                </div>
                <Link href="/collections" className={styles.textCta}>
                  View All →
                </Link>
              </div>
              <FeaturedSlider products={newArrivals} autoPlay={false} />
            </div>
          </section>
        )}

        {/* ──────── SALE SECTION ──────────────────────────── */}
        {saleProducts.length > 0 && (
          <section className={styles.saleSection} id="sale-pieces">
            <div className={styles.saleBanner}>
              <span className={styles.saleBadge}>SALE</span>
              <span className={styles.saleBannerText}>Limited Time Offers — Up to 30% Off</span>
            </div>
            <div className="container">
              <div className={styles.sectionHeaderRow}>
                <div>
                  <span className={styles.overline} style={{ color: "#f87171" }}>Special Prices</span>
                  <h2 className={styles.sectionTitle}>On Sale Now</h2>
                </div>
                <Link href="/collections" className={styles.textCta}>
                  Shop All Sale →
                </Link>
              </div>
              <FeaturedSlider products={saleProducts} autoPlay={false} />
            </div>
          </section>
        )}

        {/* ──────── TESTIMONIALS ──────────────────────────── */}
        {testimonials.length > 0 && (
          <section className={styles.sectionElevated} id="testimonials">
            <div className="container">
              <div className={styles.sectionHeader}>
                <span className={styles.overline}>Reviews</span>
                <h2 className={styles.sectionTitle}>What Our Customers Say</h2>
              </div>
              <div className={styles.testimonialsGrid}>
                {testimonials.slice(0, 3).map((t) => (
                  <div key={t.id} className={styles.testimonialCard}>
                    {/* Stars */}
                    <div className={styles.stars} aria-label={`${t.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg
                          key={i}
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill={i < t.rating ? "currentColor" : "none"}
                          stroke="currentColor"
                          strokeWidth="2"
                          className={i < t.rating ? styles.starFilled : styles.starEmpty}
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>
                    <p className={styles.testimonialText}>
                      &ldquo;{t.comment ? t.comment.slice(0, 160) + (t.comment.length > 160 ? "…" : "") : "Excellent quality!"}&rdquo;
                    </p>
                    <div className={styles.testimonialMeta}>
                      <span className={styles.testimonialName}>{t.reviewer_name || "Anonymous"}</span>
                      {t.product && (
                        <Link href={`/product/${t.product.slug}`} className={styles.testimonialProduct}>
                          {t.product.name}
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ──────── NEWSLETTER ────────────────────────────── */}
        <NewsletterCTA />

      </main>

      <Footer />
    </div>
  );
}
