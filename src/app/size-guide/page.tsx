import React from "react";
import { Metadata } from "next";
import { Header } from "@/components/storefront/Header/Header";
import { Footer } from "@/components/storefront/Footer/Footer";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import styles from "./size-guide.module.css";

export const metadata: Metadata = {
  title: "Size Guide | Ayra Collection",
  description:
    "Find your perfect fit with our detailed size guide for Eastern pret, lawn suits, silk sets, bedding, and hijabs. Measurement charts for all categories.",
  alternates: { canonical: "/size-guide" },
  openGraph: {
    title: "Size Guide | Ayra Collection",
    description: "Comprehensive sizing charts for all Ayra categories.",
    type: "website",
  },
};

const PRET_SIZES = [
  { size: "XS", chest: "32\"", waist: "26\"", hips: "34\"", length: "52\"", sleeve: "22\"" },
  { size: "S",  chest: "34\"", waist: "28\"", hips: "36\"", length: "53\"", sleeve: "22.5\"" },
  { size: "M",  chest: "36\"", waist: "30\"", hips: "38\"", length: "54\"", sleeve: "23\"" },
  { size: "L",  chest: "38\"", waist: "32\"", hips: "40\"", length: "55\"", sleeve: "23.5\"" },
  { size: "XL", chest: "40\"", waist: "34\"", hips: "42\"", length: "56\"", sleeve: "24\"" },
  { size: "XXL",chest: "42\"", waist: "36\"", hips: "44\"", length: "57\"", sleeve: "24.5\"" },
];

const DUPATTA_SIZES = [
  { category: "Lawn / Cotton", width: "40\"", length: "90\" – 96\"" },
  { category: "Chiffon / Silk", width: "44\"", length: "100\" – 110\"" },
  { category: "Net / Organza",  width: "44\"", length: "100\"" },
];

const BEDDING_SIZES = [
  { label: "Single Sheet", dimensions: "60\" × 90\" (approx.)", notes: "Standard single bed" },
  { label: "Double Sheet", dimensions: "90\" × 100\" (approx.)", notes: "Standard double / queen bed" },
  { label: "King Sheet",   dimensions: "108\" × 100\" (approx.)", notes: "King-size bed" },
  { label: "Pillow Cover", dimensions: "18\" × 27\" (approx.)", notes: "Per piece" },
  { label: "Duvet Cover",  dimensions: "90\" × 100\" (approx.)", notes: "Fits standard double duvet" },
];

const HIJAB_SIZES = [
  { style: "Square Hijab",   size: "45\" × 45\"",  fabric: "Georgette / Chiffon" },
  { style: "Rectangular",    size: "28\" × 72\"",  fabric: "Georgette / Silk" },
  { style: "Pashmina Shawl", size: "36\" × 80\"",  fabric: "Pashmina Wool" },
];

const HOW_TO_MEASURE = [
  {
    icon: "📏",
    title: "Chest / Bust",
    desc: "Measure around the fullest part of your chest, keeping the tape parallel to the ground and your arms relaxed by your sides.",
  },
  {
    icon: "〰️",
    title: "Waist",
    desc: "Measure around the narrowest part of your natural waist—usually the smallest circumference above your hips.",
  },
  {
    icon: "🔄",
    title: "Hips",
    desc: "Stand with feet together and measure around the fullest part of your hips, roughly 7–9 inches below your natural waist.",
  },
  {
    icon: "📐",
    title: "Shirt Length",
    desc: "Measure from the highest point of the shoulder down to the desired hemline while standing straight.",
  },
  {
    icon: "💪",
    title: "Sleeve Length",
    desc: "With your arm slightly bent, measure from the shoulder seam to the wrist bone.",
  },
];

export default function SizeGuidePage() {
  const baseUrl = "https://ayraa.pk";
  const breadcrumbItems = [
    { name: "Home", item: "/" },
    { name: "Size Guide", item: "/size-guide" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-bg transition-colors duration-500 ease-out">
      <BreadcrumbJsonLd items={breadcrumbItems} baseUrl={baseUrl} />
      <Header />

      <main className="grow pt-20 md:pt-16">
        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>Sizing &amp; Fit</span>
            <h1 className={styles.heroTitle}>Size Guide</h1>
            <p className={styles.heroSub}>
              Every Ayra piece is cut to a considered standard. Use this guide to find your perfect fit.
            </p>
          </div>
        </div>

        <div className={styles.container}>

          {/* How to Measure */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.badge}>Step by Step</span>
              <h2 className={styles.sectionTitle}>How to Measure</h2>
              <p className={styles.sectionSub}>
                Use a soft measuring tape for accurate results. Measure over your undergarments, not over clothing.
              </p>
            </div>
            <div className={styles.measureGrid}>
              {HOW_TO_MEASURE.map((m) => (
                <div key={m.title} className={styles.measureCard}>
                  <span className={styles.measureIcon}>{m.icon}</span>
                  <h3 className={styles.measureTitle}>{m.title}</h3>
                  <p className={styles.measureDesc}>{m.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Pret / Suits */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.badge}>Ready-to-Wear</span>
              <h2 className={styles.sectionTitle}>Pret &amp; Lawn Suits</h2>
              <p className={styles.sectionSub}>
                All measurements are in inches. Garment measurements may vary ±0.5&quot; due to fabric and handcraft.
              </p>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>Chest</th>
                    <th>Waist</th>
                    <th>Hips</th>
                    <th>Shirt Length</th>
                    <th>Sleeve</th>
                  </tr>
                </thead>
                <tbody>
                  {PRET_SIZES.map((row, i) => (
                    <tr key={row.size} className={i % 2 === 0 ? styles.rowEven : ""}>
                      <td className={styles.sizeLabel}>{row.size}</td>
                      <td>{row.chest}</td>
                      <td>{row.waist}</td>
                      <td>{row.hips}</td>
                      <td>{row.length}</td>
                      <td>{row.sleeve}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={styles.tableNote}>
              ✦ If you are between sizes, we recommend sizing up for a more traditional, relaxed fit.
            </p>
          </section>

          {/* Dupatta / Shawl */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.badge}>Drape &amp; Coverage</span>
              <h2 className={styles.sectionTitle}>Dupatta &amp; Shawl Sizes</h2>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Width</th>
                    <th>Length</th>
                  </tr>
                </thead>
                <tbody>
                  {DUPATTA_SIZES.map((row, i) => (
                    <tr key={row.category} className={i % 2 === 0 ? styles.rowEven : ""}>
                      <td className={styles.sizeLabel}>{row.category}</td>
                      <td>{row.width}</td>
                      <td>{row.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Hijab */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.badge}>Modest Fashion</span>
              <h2 className={styles.sectionTitle}>Hijab &amp; Scarf Dimensions</h2>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Style</th>
                    <th>Dimensions</th>
                    <th>Primary Fabric</th>
                  </tr>
                </thead>
                <tbody>
                  {HIJAB_SIZES.map((row, i) => (
                    <tr key={row.style} className={i % 2 === 0 ? styles.rowEven : ""}>
                      <td className={styles.sizeLabel}>{row.style}</td>
                      <td>{row.size}</td>
                      <td>{row.fabric}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Bedding */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.badge}>Home Luxury</span>
              <h2 className={styles.sectionTitle}>Bedding Dimensions</h2>
              <p className={styles.sectionSub}>
                Approximate measurements. Slight variations may occur based on weave tension and fabric shrinkage.
              </p>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Dimensions</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {BEDDING_SIZES.map((row, i) => (
                    <tr key={row.label} className={i % 2 === 0 ? styles.rowEven : ""}>
                      <td className={styles.sizeLabel}>{row.label}</td>
                      <td>{row.dimensions}</td>
                      <td>{row.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Need Help */}
          <section className={styles.helpSection}>
            <div className={styles.helpCard}>
              <span className={styles.helpIcon}>💬</span>
              <h2 className={styles.helpTitle}>Not Sure About Your Size?</h2>
              <p className={styles.helpText}>
                Our stylists are available on WhatsApp to help you find the perfect fit. Share your measurements
                and we&apos;ll recommend the right size for you.
              </p>
              <a
                href="https://wa.me/923295822495?text=Hi%20Ayraa%2C%20I%20need%20help%20with%20sizing."
                target="_blank"
                rel="noopener noreferrer"
                className={styles.helpBtn}
              >
                Chat on WhatsApp
              </a>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
