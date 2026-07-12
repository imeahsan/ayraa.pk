import React from "react";
import { Metadata } from "next";
import Image from "next/image";
import { Header } from "@/components/storefront/Header/Header";
import { Footer } from "@/components/storefront/Footer/Footer";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import styles from "./editorial.module.css";

export const metadata: Metadata = {
  title: "Editorial Journal | Ayraa Collection",
  description:
    "Read styling notes, fabric guidance, and seasonal ideas for Pakistani lawns, pret, festive edits, and wardrobe rituals.",
  alternates: { canonical: "/editorial" },
  openGraph: {
    title: "Editorial Journal | Ayraa Collection",
    description: "Styling notes and seasonal ideas from Ayraa.",
    type: "website",
  },
};

const FEATURED_ARTICLE = {
  title: "The Craft of Dressing for Pakistani Seasons",
  excerpt:
    "A quick look at how to build a wardrobe that moves from lawn mornings to festive evenings without feeling overdone.",
  category: "Style Guide",
  date: "June 2026",
  readTime: "4 min read",
  image: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1200&auto=format&fit=crop&q=80",
};

const ARTICLES = [
  {
    title: "Why Lawn Still Matters",
    excerpt:
      "Lightweight fabric, easy tailoring, and the comfort needed for long summer days in Pakistan.",
    category: "Fabric Notes",
    date: "May 2026",
    readTime: "3 min read",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80",
  },
  {
    title: "Pret That Moves from Work to Dinner",
    excerpt:
      "A few simple styling rules for co-ords, kurtas, and polished everyday silhouettes.",
    category: "Style Guide",
    date: "April 2026",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80",
  },
  {
    title: "Festive Dressing Without Overcomplication",
    excerpt:
      "How to choose color, detail, and finish for daawats, Eid, and evening plans.",
    category: "Festive",
    date: "March 2026",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80",
  },
];

const CATEGORIES = ["All", "Fabric Notes", "Style Guide", "Festive"];

export default function EditorialPage() {
  const baseUrl = "https://store.ayraa.pk";
  const breadcrumbItems = [
    { name: "Home", item: "/" },
    { name: "Editorial Journal", item: "/editorial" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-bg transition-colors duration-500 ease-out">
      <BreadcrumbJsonLd items={breadcrumbItems} baseUrl={baseUrl} />
      <Header />

      <main className="grow pt-20 md:pt-16">
        <div className={styles.hero}>
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>The Journal</span>
            <h1 className={styles.heroTitle}>Editorial</h1>
            <p className={styles.heroSub}>Style notes for Pakistani wardrobes, seasons, and rituals.</p>
          </div>
        </div>

        <div className={styles.container}>
          <div className={styles.categoryRow}>
            {CATEGORIES.map((cat) => (
              <span key={cat} className={`${styles.categoryTag} ${cat === "All" ? styles.categoryTagActive : ""}`}>
                {cat}
              </span>
            ))}
          </div>

          <section className={styles.featured}>
            <div className={styles.featuredImageWrapper}>
              <Image
                src={FEATURED_ARTICLE.image}
                alt={FEATURED_ARTICLE.title}
                fill
                sizes="(max-width: 768px) 100vw, 60vw"
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
              <span className={styles.readMore}>Stories coming soon</span>
            </div>
          </section>

          <section className={styles.grid}>
            {ARTICLES.map((article) => (
              <article key={article.title} className={styles.card}>
                <div className={styles.cardImageWrapper}>
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
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
                    <span className={styles.cardLink}>Preview</span>
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
