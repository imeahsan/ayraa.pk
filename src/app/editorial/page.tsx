import React from "react";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/storefront/Header/Header";
import { Footer } from "@/components/storefront/Footer/Footer";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import styles from "./editorial.module.css";

export const metadata: Metadata = {
  title: "Editorial Journal | Ayra Collection",
  description:
    "Explore Ayra's editorial journal—stories of craftsmanship, style inspiration, cultural heritage, and the art of dressing with intention.",
  alternates: { canonical: "/editorial" },
  openGraph: {
    title: "Editorial Journal | Ayra Collection",
    description: "Stories of heritage, craft, and style from the Ayra atelier.",
    type: "website",
  },
};

const FEATURED_ARTICLE = {
  title: "The Art of Zardozi: Gold Thread Embroidery and Its Mughal Roots",
  excerpt:
    "Few crafts capture the opulence of the Mughal era as vividly as Zardozi—the art of embellishing fabric with gold and silver threads, beads, and precious stones. We trace its journey from the royal courts of Agra to the modern couture studios of Lahore.",
  category: "Heritage Craft",
  date: "June 2025",
  readTime: "7 min read",
  image: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1200&auto=format&fit=crop&q=80",
  slug: "#",
};

const ARTICLES = [
  {
    title: "How to Style a Lawn Suit: From Dawn to Dusk",
    excerpt: "Lawn—Pakistan's beloved summer fabric—is more versatile than you think. Our stylists show you how to take one suit from a morning family gathering to an evening soiree.",
    category: "Style Guide",
    date: "May 2025",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80",
    slug: "#",
  },
  {
    title: "The Fabric Lexicon: Understanding Eastern Textiles",
    excerpt: "Khaddi, Karandi, Chiffon, Raw Silk—our comprehensive guide to the fabrics that define Eastern fashion, their properties, and how to care for each.",
    category: "Education",
    date: "April 2025",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&auto=format&fit=crop&q=80",
    slug: "#",
  },
  {
    title: "Modest Fashion in 2025: Global Trends Meeting Local Sensibility",
    excerpt: "From Dubai runways to Karachi boutiques, modest fashion is having its global moment. We explore how Pakistani designers are shaping the global narrative.",
    category: "Trends",
    date: "March 2025",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80",
    slug: "#",
  },
  {
    title: "The Ceremony Capsule: Building Your Bridal Trousseau",
    excerpt: "A guide to building a thoughtful bridal wardrobe that balances tradition with your personal aesthetic—including what to splurge on and where to be practical.",
    category: "Bridal",
    date: "February 2025",
    readTime: "8 min read",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80",
    slug: "#",
  },
  {
    title: "Inside the Atelier: A Day with Ayra's Head Embroiderer",
    excerpt: "We spent a day in the Ayra workshop with master embroiderer Noor Ahmed, whose family has practiced the craft for four generations. His story is one of devotion.",
    category: "Heritage Craft",
    date: "January 2025",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80",
    slug: "#",
  },
  {
    title: "Linen & Luxury: Why Natural Fibers Remain Supreme",
    excerpt: "In an age of fast fashion synthetics, we make the case for investing in natural fibers—why they age beautifully, breathe better, and feel unmatched against the skin.",
    category: "Education",
    date: "December 2024",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&auto=format&fit=crop&q=80",
    slug: "#",
  },
];

const CATEGORIES = ["All", "Heritage Craft", "Style Guide", "Trends", "Education", "Bridal"];

export default function EditorialPage() {
  const baseUrl = "https://ayraa.pk";
  const breadcrumbItems = [
    { name: "Home", item: "/" },
    { name: "Editorial Journal", item: "/editorial" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-bg transition-colors duration-500 ease-out">
      <BreadcrumbJsonLd items={breadcrumbItems} baseUrl={baseUrl} />
      <Header />

      <main className="grow">
        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>The Journal</span>
            <h1 className={styles.heroTitle}>Editorial</h1>
            <p className={styles.heroSub}>
              Stories of heritage, craft, and the art of dressing with intention.
            </p>
          </div>
        </div>

        <div className={styles.container}>

          {/* Category Filter */}
          <div className={styles.categoryRow}>
            {CATEGORIES.map((cat) => (
              <span key={cat} className={`${styles.categoryTag} ${cat === "All" ? styles.categoryTagActive : ""}`}>
                {cat}
              </span>
            ))}
          </div>

          {/* Featured Article */}
          <section className={styles.featured}>
            <div className={styles.featuredImageWrapper}>
              <Image
                src={FEATURED_ARTICLE.image}
                alt={FEATURED_ARTICLE.title}
                fill
                className="object-cover"
              />
              <div className={styles.featuredImageOverlay} />
            </div>
            <div className={styles.featuredContent}>
              <div className={styles.meta}>
                <span className={styles.catTag}>{FEATURED_ARTICLE.category}</span>
                <span className={styles.metaSep}>·</span>
                <span className={styles.metaText}>{FEATURED_ARTICLE.date}</span>
                <span className={styles.metaSep}>·</span>
                <span className={styles.metaText}>{FEATURED_ARTICLE.readTime}</span>
              </div>
              <h2 className={styles.featuredTitle}>{FEATURED_ARTICLE.title}</h2>
              <p className={styles.featuredExcerpt}>{FEATURED_ARTICLE.excerpt}</p>
              <Link href={FEATURED_ARTICLE.slug} className={styles.readMore}>
                Read Article →
              </Link>
            </div>
          </section>

          {/* Article Grid */}
          <section className={styles.grid}>
            {ARTICLES.map((article) => (
              <article key={article.title} className={styles.card}>
                <div className={styles.cardImageWrapper}>
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    className={`object-cover ${styles.cardImage}`}
                  />
                </div>
                <div className={styles.cardContent}>
                  <div className={styles.meta}>
                    <span className={styles.catTag}>{article.category}</span>
                    <span className={styles.metaSep}>·</span>
                    <span className={styles.metaText}>{article.readTime}</span>
                  </div>
                  <h3 className={styles.cardTitle}>{article.title}</h3>
                  <p className={styles.cardExcerpt}>{article.excerpt}</p>
                  <div className={styles.cardFooter}>
                    <span className={styles.cardDate}>{article.date}</span>
                    <Link href={article.slug} className={styles.cardLink}>
                      Read →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
