import React from "react";
import Image from "next/image";
import { Metadata } from "next";
import { Header } from "@/components/storefront/Header/Header";
import { Footer } from "@/components/storefront/Footer/Footer";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import styles from "./about.module.css";

export const metadata: Metadata = {
  title: "Our Story",
  description: "Learn about the heritage, craftsmanship, and luxury design values of Ayra. Indulge in premium quality fabrics and hand-crafted Eastern fashion.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "Our Story | Ayra Collection",
    description: "Learn about the heritage, craftsmanship, and luxury design values of Ayra.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Our Story | Ayra Collection",
    description: "Learn about the heritage, craftsmanship, and luxury design values of Ayra.",
  },
};

export default function AboutPage() {
  const baseUrl = "https://ayracollection.vercel.app";
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
            alt="Ayra Atelier"
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
                <span className={styles.badge}>Heritage</span>
                <h2 className={styles.title}>Crafted For The Modern Muse</h2>
                <p className={styles.text}>
                  Founded on the principles of traditional Eastern couture, <strong>Ayra</strong> weaves together
                  centuries of heritage craftsmanship with contemporary silhouettes. Each piece is a
                  testament to the skill of master artisans who keep the heritage of gold-threaded
                  embroidery (Zardozi) alive.
                </p>
                <p className={styles.text}>
                  Our design atelier works with premium natural fibers—pure raw silks, high-grade
                  lawn cottons, and fine chiffons—to ensure that luxury is felt in every drape.
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
            <h2 className={styles.pillarsTitle}>Our Core Pillars</h2>
            <div className={styles.pillarsGrid}>
              <div className={styles.pillarCard}>
                <span className={styles.pillarIcon}>✨</span>
                <h3 className={styles.pillarTitle}>Artisanal Integrity</h3>
                <p className={styles.pillarText}>
                  We collaborate with heritage weaving communities, ensuring fair compensation and preserving
                  intricate hand-work details.
                </p>
              </div>
              <div className={styles.pillarCard}>
                <span className={styles.pillarIcon}>⚜️</span>
                <h3 className={styles.pillarTitle}>Sartorial Luxury</h3>
                <p className={styles.pillarText}>
                  From gold-threaded borders to double-lining slips, every detail is engineered to satisfy the
                  highest luxury standards.
                </p>
              </div>
              <div className={styles.pillarCard}>
                <span className={styles.pillarIcon}>⏳</span>
                <h3 className={styles.pillarTitle}>Timeless Longevity</h3>
                <p className={styles.pillarText}>
                  Our collections transcend seasonal drops. We focus on classic silhouettes designed to last
                  generations.
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
