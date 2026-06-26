import React from "react";
import { Metadata } from "next";
import { Header } from "@/components/storefront/Header/Header";
import { Footer } from "@/components/storefront/Footer/Footer";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import styles from "./shipping-returns.module.css";

export const metadata: Metadata = {
  title: "Shipping & Returns | Ayra Collection",
  description:
    "Learn about Ayra's shipping timelines, Cash on Delivery policy across Pakistan, and hassle-free returns process.",
  alternates: { canonical: "/shipping-returns" },
  openGraph: {
    title: "Shipping & Returns | Ayra Collection",
    description: "Shipping timelines and return policy for Ayra premium fashion.",
    type: "website",
  },
};

const SHIPPING_INFO = [
  {
    icon: "📦",
    title: "Order Processing",
    desc: "All orders are processed within 1–2 business days. You will receive an order confirmation SMS immediately after placing your order.",
  },
  {
    icon: "🚚",
    title: "Delivery Timeline",
    desc: "Standard delivery across Pakistan takes 3–5 business days. Remote areas may take up to 7 business days. Delivery timelines exclude weekends and public holidays.",
  },
  {
    icon: "💵",
    title: "Cash on Delivery",
    desc: "We exclusively offer Cash on Delivery (COD) for all orders across Pakistan. No advance payment required—pay when your parcel arrives at your doorstep.",
  },
  {
    icon: "🔖",
    title: "Shipping Charges",
    desc: "Flat shipping fee of PKR 200 applies to all orders. Orders above PKR 5,000 qualify for free shipping anywhere in Pakistan.",
  },
];

const RETURN_STEPS = [
  { step: "01", title: "Contact Us", desc: "Reach out via WhatsApp or email within 3 days of receiving your order. Share your order number and the reason for return." },
  { step: "02", title: "Return Approval", desc: "Our team will review your request within 24 hours and issue a return authorization if eligible." },
  { step: "03", title: "Ship the Item", desc: "Carefully pack the item in its original packaging and hand it over to our designated courier. We arrange the pickup from your location." },
  { step: "04", title: "Refund / Exchange", desc: "Once received and inspected, we process your exchange or store credit within 5–7 business days." },
];

const NOT_ELIGIBLE = [
  "Items that have been worn, washed, or altered",
  "Products without original tags or packaging",
  "Custom-stitched or made-to-order pieces",
  "Sale or clearance items",
  "Bedding products once opened",
  "Hijabs and scarves for hygiene reasons",
];

export default function ShippingReturnsPage() {
  const baseUrl = "https://ayraa.pk";
  const breadcrumbItems = [
    { name: "Home", item: "/" },
    { name: "Shipping & Returns", item: "/shipping-returns" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-bg transition-colors duration-500 ease-out">
      <BreadcrumbJsonLd items={breadcrumbItems} baseUrl={baseUrl} />
      <Header />

      <main className="grow pt-20 md:pt-16">
        <div className={styles.hero}>
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>Delivery &amp; Policy</span>
            <h1 className={styles.heroTitle}>Shipping &amp; Returns</h1>
            <p className={styles.heroSub}>
              We deliver across Pakistan with care and pride. Your satisfaction is our commitment.
            </p>
          </div>
        </div>

        <div className={styles.container}>

          {/* Shipping Info */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.badge}>Delivery</span>
              <h2 className={styles.sectionTitle}>Shipping Information</h2>
            </div>
            <div className={styles.infoGrid}>
              {SHIPPING_INFO.map((item) => (
                <div key={item.title} className={styles.infoCard}>
                  <span className={styles.infoIcon}>{item.icon}</span>
                  <div>
                    <h3 className={styles.infoTitle}>{item.title}</h3>
                    <p className={styles.infoDesc}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Return Process */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.badge}>Returns &amp; Exchanges</span>
              <h2 className={styles.sectionTitle}>How to Return</h2>
              <p className={styles.sectionSub}>
                We accept returns and exchanges within <strong>3 days</strong> of delivery, subject to the conditions below.
              </p>
            </div>
            <div className={styles.stepsGrid}>
              {RETURN_STEPS.map((s) => (
                <div key={s.step} className={styles.stepCard}>
                  <span className={styles.stepNumber}>{s.step}</span>
                  <h3 className={styles.stepTitle}>{s.title}</h3>
                  <p className={styles.stepDesc}>{s.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Not Eligible */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.badge}>Important</span>
              <h2 className={styles.sectionTitle}>Non-Returnable Items</h2>
            </div>
            <div className={styles.notEligibleCard}>
              <ul className={styles.notEligibleList}>
                {NOT_ELIGIBLE.map((item) => (
                  <li key={item} className={styles.notEligibleItem}>
                    <span className={styles.bullet}>✗</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Contact CTA */}
          <section className={styles.ctaSection}>
            <div className={styles.ctaCard}>
              <h2 className={styles.ctaTitle}>Have a Question?</h2>
              <p className={styles.ctaText}>
                Our customer care team is available Monday – Saturday, 10AM – 6PM PST.
              </p>
              <div className={styles.ctaBtns}>
                <a
                  href="https://wa.me/923295822495"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.btnPrimary}
                >
                  WhatsApp Us
                </a>
                <a href="/contact" className={styles.btnSecondary}>
                  Contact Form
                </a>
              </div>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
