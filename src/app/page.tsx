import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { Header } from "@/components/storefront/Header/Header";
import { Footer } from "@/components/storefront/Footer/Footer";
import { createCacheClient } from "@/lib/supabase/cache-client";
import { Product, Category } from "@/types";
import styles from "./page.module.css";
import { FeaturedSlider } from "@/components/storefront/FeaturedSlider/FeaturedSlider";
import { NewsletterCTA } from "@/components/storefront/NewsletterCTA/NewsletterCTA";
import { HeroSlider } from "@/components/storefront/HeroSlider/HeroSlider";
import { unstable_cache } from "next/cache";
import { DEFAULT_OG_IMAGE, DEFAULT_SEO_DESCRIPTION, DEFAULT_SEO_TITLE, absoluteUrl, getSiteUrl } from "@/lib/seo";
import { ItemListJsonLd } from "@/components/seo/ItemListJsonLd";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: DEFAULT_SEO_TITLE,
  description: DEFAULT_SEO_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: DEFAULT_SEO_TITLE,
    description: DEFAULT_SEO_DESCRIPTION,
    url: "/",
    images: [{ url: absoluteUrl(DEFAULT_OG_IMAGE), alt: "Ayraa Pakistani fashion and home textiles" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_SEO_TITLE,
    description: DEFAULT_SEO_DESCRIPTION,
    images: [absoluteUrl(DEFAULT_OG_IMAGE)],
  },
};

// No fallback mock products or categories

const PAKISTANI_EDIT_PROFILES = [
  {
    keys: ["lawn", "print", "unstitched"],
    eyebrow: "Summer lawn",
    description: "Airy printed suits for Pakistan's long warm season, from everyday wear to family lunches.",
    occasion: "Daily wear, office, university",
  },
  {
    keys: ["pret", "garment", "kurta", "ready"],
    eyebrow: "Ready-to-wear",
    description: "Polished kurtas, co-ords, and easy separates made for quick styling without tailoring delays.",
    occasion: "Workdays, dinners, travel",
  },
  {
    keys: ["formal", "luxury", "festive", "embroidered"],
    eyebrow: "Festive formals",
    description: "Elevated embroideries, graceful drapes, and occasion-ready details for daawats and Eid plans.",
    occasion: "Eid, mehndi, evening events",
  },
  {
    keys: ["hijab", "dupatta", "modest", "scarf"],
    eyebrow: "Modest essentials",
    description: "Soft hijabs and finishing layers that pair cleanly with lawn, pret, and formal eastern wear.",
    occasion: "Everyday styling, layering",
  },
  {
    keys: ["bed", "home"],
    eyebrow: "Home textile",
    description: "Coordinated bedding for a softer home setting after the day's wardrobe has been chosen.",
    occasion: "Bedrooms, guest rooms",
  },
];

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

// No fallback hero slides

const getCachedHeroSlides = unstable_cache(
  async () => {
    const supabase = createCacheClient();
    const { data } = await supabase
      .from("hero_slides")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    return data || [];
  },
  ["hero-slides"],
  { revalidate: 300, tags: ["hero-slides"] }
);

const getCachedFeaturedProducts = unstable_cache(
  async () => {
    const supabase = createCacheClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, category:categories(*), images:product_images(*), variants:product_variants!inner(*)")
      .eq("is_featured", true)
      .eq("is_active", true)
      .gt("variants.stock_quantity", 0)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as Product[];
  },
  ["featured-products"],
  { revalidate: 300, tags: ["products"] }
);

const getCachedNewArrivals = unstable_cache(
  async () => {
    const supabase = createCacheClient();
    const { data } = await supabase
      .from("products")
      .select("*, category:categories(*), images:product_images(*), variants:product_variants!inner(*)")
      .eq("is_active", true)
      .gt("variants.stock_quantity", 0)
      .order("created_at", { ascending: false })
      .limit(8);
    return (data || []) as Product[];
  },
  ["new-arrivals"],
  { revalidate: 300, tags: ["products"] }
);

const getCachedSaleProducts = unstable_cache(
  async () => {
    const supabase = createCacheClient();
    const { data } = await supabase
      .from("products")
      .select("*, category:categories(*), images:product_images(*), variants:product_variants!inner(*)")
      .eq("is_on_sale", true)
      .eq("is_active", true)
      .gt("variants.stock_quantity", 0);
    return (data || []) as Product[];
  },
  ["sale-products"],
  { revalidate: 300, tags: ["products"] }
);

const getCachedDisplayCategories = unstable_cache(
  async () => {
    const supabase = createCacheClient();
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .is("parent_id", null)
      .order("sort_order", { ascending: true });
    return (data || []) as Category[];
  },
  ["homepage-categories"],
  { revalidate: 300, tags: ["categories"] }
);

type HomeTestimonial = {
  id: string;
  rating: number;
  comment: string | null;
  reviewer_name: string | null;
  product?: { name: string; slug: string } | null;
};

type HomeTestimonialRow = Omit<HomeTestimonial, "product"> & {
  product?: { name: string; slug: string } | { name: string; slug: string }[] | null;
};

const getCachedTestimonials = unstable_cache(
  async () => {
    const supabase = createCacheClient();
    const { data } = await supabase
      .from("product_reviews")
      .select("id, rating, comment, reviewer_name, product:products(name, slug)")
      .order("created_at", { ascending: false })
      .limit(6);
    const rows = (data || []) as unknown as HomeTestimonialRow[];
    return rows.map((row) => {
      const product = Array.isArray(row.product) ? row.product[0] : row.product;
      return {
        ...row,
        product: product ? { name: product.name, slug: product.slug } : null,
      };
    });
  },
  ["testimonials"],
  { revalidate: 300, tags: ["reviews"] }
);

export default async function Home() {
  const filterInStockOnly = (prods: Product[]) => {
    return prods.filter((p) => {
      if (!p.variants || p.variants.length === 0) return true;
      return p.variants.some((v) => v.stock_quantity > 0);
    });
  };

  // ── Hero slides ──────────────────────────────
  let heroSlides: any[] = [];
  try {
    const data = await getCachedHeroSlides();
    if (data && data.length > 0) {
      heroSlides = data;
    }
  } catch {
    // Fallback
  }

  // ── Featured products ──────────────────────────────
  let featuredProducts: Product[] = [];
  try {
    const data = await getCachedFeaturedProducts();
    featuredProducts = data && data.length > 0 ? data : [];
  } catch {
    featuredProducts = [];
  }
  featuredProducts = filterInStockOnly(featuredProducts);

  // ── New arrivals (latest 8) ────────────────────────
  let newArrivals: Product[] = [];
  try {
    newArrivals = await getCachedNewArrivals();
  } catch { /* ignore */ }
  newArrivals = filterInStockOnly(newArrivals);

  // ── Sale products ──────────────────────────────────
  let saleProducts: Product[] = [];
  try {
    saleProducts = await getCachedSaleProducts();
  } catch { /* ignore */ }
  saleProducts = filterInStockOnly(saleProducts);

  // ── Active parent categories for mosaic ───────────
  let displayCategories: Category[] = [];
  try {
    const data = await getCachedDisplayCategories();
    if (data && data.length > 0) displayCategories = data;
  } catch { /* ignore */ }

  // ── Testimonials / recent reviews ─────────────────
  let testimonials: HomeTestimonial[] = [];
  try {
    testimonials = await getCachedTestimonials();
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
  const getPakistaniEditProfile = (cat: Category) => {
    const searchable = `${cat.slug} ${cat.name}`.toLowerCase();
    return (
      PAKISTANI_EDIT_PROFILES.find((profile) =>
        profile.keys.some((key) => searchable.includes(key))
      ) || {
        eyebrow: "Eastern edit",
        description: cat.description || "Thoughtfully selected pieces for Pakistani wardrobes, refined styling, and everyday grace.",
        occasion: "Seasonal wardrobe refresh",
      }
    );
  };
  const wardrobeCategories = displayCategories.filter((cat) => {
    const searchable = `${cat.slug} ${cat.name}`.toLowerCase();
    return !["bed", "home"].some((key) => searchable.includes(key));
  });
  const pakistaniEditCategories = wardrobeCategories.length >= 3 ? wardrobeCategories : displayCategories;
  const baseUrl = getSiteUrl();

  return (
    <div className={`${styles.homeShell} flex flex-col min-h-screen bg-bg transition-colors duration-500 ease-out`}>
      <ItemListJsonLd
        name="Ayraa wardrobe collections"
        baseUrl={baseUrl}
        items={pakistaniEditCategories.map((category) => ({
          name: category.name,
          url: `/collections/${category.slug}`,
        }))}
      />
      <ItemListJsonLd
        name="Featured Ayraa products"
        baseUrl={baseUrl}
        items={featuredProducts.slice(0, 8).map((product) => ({
          name: product.name,
          url: `/product/${product.slug}`,
        }))}
      />
      <Header />

      <main className={`${styles.main} grow pt-20 md:pt-16`}>

        {/* ──────── HERO SLIDER ────────────────────────────── */}
        <HeroSlider slides={heroSlides} />

        {/* ──────── PAKISTANI WARDROBE EDITS ───────────────── */}
        <section className={styles.section} id="shop-by-category">
          <div className={styles.sectionHeader}>
            <span className={styles.overline}>Pakistani Wardrobe</span>
            <h2 className={styles.sectionTitle}>Dress for the Season, the Daawat, and the Everyday</h2>
            <p className={styles.sectionDesc}>
              Move through airy lawn, pret kurtas, festive formals, and modest essentials
              with edits built around how Pakistani wardrobes are actually worn.
            </p>
          </div>

          <div className={styles.wardrobeGrid}>
            {pakistaniEditCategories.map((cat, i) => {
              const profile = getPakistaniEditProfile(cat);
              return (
              <Link
                key={cat.id}
                href={`/collections/${cat.slug}`}
                className={`${styles.wardrobeCard} ${i === 0 ? styles.wardrobeCardHero : ""}`}
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
                  <span className={styles.mosaicNumber}>{profile.eyebrow}</span>
                  <h3 className={styles.mosaicTitle}>{cat.name}</h3>
                  <p className={styles.mosaicMeta}>
                    {profile.description}
                  </p>
                  <span className={styles.occasionPill}>{profile.occasion}</span>
                  <span className={styles.mosaicCta}>Explore →</span>
                </div>
              </Link>
              );
            })}
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
              <div className={styles.brandTextureCard}>
                <span>Material note</span>
                <strong>Soft hand-feel, structured finish, refined fall.</strong>
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
