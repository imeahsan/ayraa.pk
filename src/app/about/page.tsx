import React from "react";
import Image from "next/image";
import { Metadata } from "next";
import { Header } from "@/components/storefront/Header/Header";
import { Footer } from "@/components/storefront/Footer/Footer";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import styles from "./about.module.css";

export const metadata: Metadata = {
  title: "Our Story | Ayraa Collection",
  description:
    "Learn how Ayraa blends Pakistani wardrobe essentials, seasonal lawn, refined pret, and considered home pieces into one graceful brand story.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "Our Story | Ayraa Collection",
    description:
      "Learn how Ayraa blends Pakistani wardrobe essentials, seasonal lawn, refined pret, and considered home pieces into one graceful brand story.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Our Story | Ayraa Collection",
    description:
      "Learn how Ayraa blends Pakistani wardrobe essentials, seasonal lawn, refined pret, and considered home pieces into one graceful brand story.",
  },
};

export default function AboutPage() {
  const baseUrl = "https://ayraa.pk";
  const breadcrumbItems = [
    { name: "Home", item: "/" },
    { name: "Our Story", item: "/about" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-bg transition-colors duration-500 ease-out">
      <BreadcrumbJsonLd items={breadcrumbItems} baseUrl={baseUrl} />
      <Header />

      <main className="grow pt-20 md:pt-16">
        <div className={styles.hero}>
          <Image
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80"
            alt="Ayraa atelier"
            fill
            className="object-cover opacity-70"
          />
          <div className={styles.heroOverlay} />
          <h1 className={styles.heroTitle}>Our Story</h1>
        </div>

        <div className={styles.container}>
          <section className={styles.storySection}>
            <div className={styles.grid}>
              <div className={styles.contentCol}>
                <span className={styles.badge}>Brand Vision</span>
                <h2 className={styles.title}>Made for Pakistani seasons and everyday grace</h2>
                <p className={styles.text}>
                  Ayraa is built around the way people actually dress in Pakistan. We focus on lawn
                  for warm days, pret for easy styling, festive pieces for daawats and Eid, and
                  home edits that fit a calm, thoughtful lifestyle.
                </p>
                <p className={styles.text}>
                  Our approach is simple: keep the silhouette refined, the fabric considered, and the
                  experience easy to shop. The result is a wardrobe that feels polished without being
                  overworked.
                </p>
              </div>
              <div className={styles.imageWrapper}>
                <div className="relative w-full h-full">
                  <Image
                    src="https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80"
                    alt="Embroidered details"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className={styles.pillarsSection}>
            <h2 className={styles.pillarsTitle}>What We Care About</h2>
            <div className={styles.pillarsGrid}>
              <div className={styles.pillarCard}>
                <span className={styles.pillarIcon}>Craft</span>
                <h3 className={styles.pillarTitle}>Considered Details</h3>
                <p className={styles.pillarText}>
                  We pay attention to finishing, comfort, and fit so pieces work in real life, not
                  just in lookbook images.
                </p>
              </div>
              <div className={styles.pillarCard}>
                <span className={styles.pillarIcon}>Season</span>
                <h3 className={styles.pillarTitle}>Seasonal Relevance</h3>
                <p className={styles.pillarText}>
                  We design around Pakistani weather, occasions, and wardrobe rhythms instead of
                  forcing a generic luxury template.
                </p>
              </div>
              <div className={styles.pillarCard}>
                <span className={styles.pillarIcon}>Ease</span>
                <h3 className={styles.pillarTitle}>Simple Shopping</h3>
                <p className={styles.pillarText}>
                  We keep navigation, category labeling, and product storytelling straightforward so
                  customers can move quickly from browse to buy.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
