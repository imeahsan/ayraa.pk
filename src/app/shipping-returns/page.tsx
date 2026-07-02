import React from "react";
import { Metadata } from "next";
import { Header } from "@/components/storefront/Header/Header";
import { Footer } from "@/components/storefront/Footer/Footer";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import styles from "./shipping-returns.module.css";

export const metadata: Metadata = {
  title: "Shipping & Returns | Ayraa Collection",
  description:
    "Learn about Ayraa's shipping timelines, Cash on Delivery policy, and return process across Pakistan.",
  alternates: { canonical: "/shipping-returns" },
  openGraph: {
    title: "Shipping & Returns | Ayraa Collection",
    description: "Shipping timelines and return policy for Ayraa.",
    type: "website",
  },
};

const SHIPPING_INFO = [
  {
    icon: "Box",
    title: "Order Processing",
    desc: "Orders are processed within 1 to 2 business days. You will receive an order confirmation after checkout.",
  },
  {
    icon: "Truck",
    title: "Delivery Timeline",
    desc: "Standard delivery across Pakistan usually takes 3 to 5 business days. Remote areas may take up to 7 business days.",
  },
  {
    icon: "COD",
    title: "Cash on Delivery",
    desc: "We currently offer Cash on Delivery across Pakistan.",
  },
  {
    icon: "Fee",
    title: "Shipping Charges",
    desc: "Shipping charges are shown at checkout. Free shipping can apply during selected offers.",
  },
];

const RETURN_STEPS = [
  { step: "01", title: "Contact Us", desc: "Message us within 3 days of delivery with your order number and reason for return." },
  { step: "02", title: "Return Review", desc: "We check whether the item is eligible for return or exchange." },
  { step: "03", title: "Pickup or Drop-off", desc: "If approved, we will guide you on the next step for collection or handover." },
  { step: "04", title: "Exchange or Credit", desc: "Once inspected, we process exchange or store credit according to the return outcome." },
];

const NOT_ELIGIBLE = [
  "Items that have been worn, washed, or altered",
  "Products without original tags or packaging",
  "Custom-stitched or made-to-order pieces",
  "Sale or clearance items",
  "Opened bedding items",
  "Hijabs and scarves for hygiene reasons",
];

export default function ShippingReturnsPage() {
  const baseUrl = "https://store.ayraa.pk";
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
              We deliver across Pakistan with clear timelines and simple return rules.
            </p>
          </div>
        </div>

        <div className={styles.container}>
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

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.badge}>Returns &amp; Exchanges</span>
              <h2 className={styles.sectionTitle}>How to Return</h2>
              <p className={styles.sectionSub}>
                Eligible items can be returned or exchanged within 3 days of delivery.
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

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.badge}>Important</span>
              <h2 className={styles.sectionTitle}>Non-Returnable Items</h2>
            </div>
            <div className={styles.notEligibleCard}>
              <ul className={styles.notEligibleList}>
                {NOT_ELIGIBLE.map((item) => (
                  <li key={item} className={styles.notEligibleItem}>
                    <span className={styles.bullet}>x</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className={styles.ctaSection}>
            <div className={styles.ctaCard}>
              <h2 className={styles.ctaTitle}>Have a Question?</h2>
              <p className={styles.ctaText}>
                Our customer care team is available Monday to Saturday, 10AM to 6PM PKT.
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
