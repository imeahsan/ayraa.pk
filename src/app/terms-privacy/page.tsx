import React from "react";
import { Metadata } from "next";
import { Header } from "@/components/storefront/Header/Header";
import { Footer } from "@/components/storefront/Footer/Footer";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import styles from "./terms-privacy.module.css";

export const metadata: Metadata = {
  title: "Terms & Privacy Policy | Ayraa Collection",
  description:
    "Read Ayraa Collection's Terms of Service and Privacy Policy for browsing, ordering, and data handling.",
  alternates: { canonical: "/terms-privacy" },
  openGraph: {
    title: "Terms & Privacy Policy | Ayraa Collection",
    description: "Terms of use and privacy policy for Ayraa Collection.",
    type: "website",
  },
};

export default function TermsPrivacyPage() {
  const baseUrl = "https://ayraa.pk";
  const breadcrumbItems = [
    { name: "Home", item: "/" },
    { name: "Terms & Privacy", item: "/terms-privacy" },
  ];
  const lastUpdated = "June 2026";

  return (
    <div className="flex flex-col min-h-screen bg-bg transition-colors duration-500 ease-out">
      <BreadcrumbJsonLd items={breadcrumbItems} baseUrl={baseUrl} />
      <Header />

      <main className="grow pt-20 md:pt-16">
        <div className={styles.hero}>
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>Legal</span>
            <h1 className={styles.heroTitle}>Terms &amp; Privacy</h1>
            <p className={styles.heroSub}>Last updated: {lastUpdated}</p>
          </div>
        </div>

        <div className={styles.container}>
          <div className={styles.layout}>
            <aside className={styles.toc}>
              <p className={styles.tocLabel}>On This Page</p>
              <nav>
                <a href="#terms" className={styles.tocLink}>Terms of Service</a>
                <a href="#privacy" className={styles.tocLink}>Privacy Policy</a>
                <a href="#cookies" className={styles.tocLink}>Cookie Policy</a>
                <a href="#contact-legal" className={styles.tocLink}>Contact Us</a>
              </nav>
            </aside>

            <article className={styles.content}>
              <section id="terms" className={styles.section}>
                <h2 className={styles.sectionTitle}>Terms of Service</h2>
                <p className={styles.intro}>
                  By using the Ayraa website, you agree to these terms. Please read them before placing an order.
                </p>
                <h3 className={styles.subTitle}>1. Acceptance of Terms</h3>
                <p className={styles.para}>
                  These terms govern your use of the website and services. By browsing, registering, or purchasing, you confirm that you are legally able to enter into a contract.
                </p>
                <h3 className={styles.subTitle}>2. Products and Pricing</h3>
                <p className={styles.para}>
                  Products are subject to availability. Prices are shown in Pakistani Rupees and may change without notice. Confirmed orders are not affected by later price changes.
                </p>
                <h3 className={styles.subTitle}>3. Orders and Payment</h3>
                <p className={styles.para}>
                  Orders are currently accepted on a Cash on Delivery basis. We may cancel orders suspected of fraud or orders that cannot be fulfilled.
                </p>
                <h3 className={styles.subTitle}>4. Shipping and Delivery</h3>
                <p className={styles.para}>
                  Delivery timelines are estimates and may vary based on courier conditions or public holidays.
                </p>
                <h3 className={styles.subTitle}>5. Returns and Refunds</h3>
                <p className={styles.para}>
                  Eligible items can be returned within 3 days of delivery. Please refer to our <a href="/shipping-returns" className={styles.inlineLink}>Shipping &amp; Returns</a> page for details.
                </p>
                <h3 className={styles.subTitle}>6. Intellectual Property</h3>
                <p className={styles.para}>
                  All website content, imagery, text, and branding are protected and may not be reused without permission.
                </p>
                <h3 className={styles.subTitle}>7. Governing Law</h3>
                <p className={styles.para}>
                  These terms are governed by the laws of Pakistan.
                </p>
              </section>

              <hr className={styles.divider} />

              <section id="privacy" className={styles.section}>
                <h2 className={styles.sectionTitle}>Privacy Policy</h2>
                <p className={styles.intro}>
                  We collect only the information needed to process orders, communicate with you, and improve the store.
                </p>
                <h3 className={styles.subTitle}>1. Information We Collect</h3>
                <p className={styles.para}>
                  When you place an order, we collect your name, phone number, email address, and delivery details. We may also collect basic analytics data to improve the website.
                </p>
                <h3 className={styles.subTitle}>2. How We Use Your Information</h3>
                <ul className={styles.list}>
                  <li>To process and deliver your orders</li>
                  <li>To send order confirmations and delivery updates</li>
                  <li>To respond to customer care enquiries</li>
                  <li>To send promotional updates if you opt in</li>
                </ul>
                <h3 className={styles.subTitle}>3. Data Sharing</h3>
                <p className={styles.para}>
                  We do not sell your personal information. We only share delivery details with logistics partners when needed to fulfill your order.
                </p>
                <h3 className={styles.subTitle}>4. Your Rights</h3>
                <p className={styles.para}>
                  You may request access, correction, or deletion of your personal data by contacting us.
                </p>
              </section>

              <hr className={styles.divider} />

              <section id="cookies" className={styles.section}>
                <h2 className={styles.sectionTitle}>Cookie Policy</h2>
                <p className={styles.para}>
                  Our website uses cookies for core functionality and analytics. You can disable cookies in your browser, but some features may stop working.
                </p>
              </section>

              <hr className={styles.divider} />

              <section id="contact-legal" className={styles.section}>
                <h2 className={styles.sectionTitle}>Contact Us</h2>
                <p className={styles.para}>
                  For legal or privacy requests, contact us through the channels below.
                </p>
                <div className={styles.contactBlock}>
                  <p><strong>Ayraa Collection</strong></p>
                  <p>Lahore, Punjab, Pakistan</p>
                  <p>Email: <a href="mailto:legal@ayraa.pk" className={styles.inlineLink}>legal@ayraa.pk</a></p>
                  <p>WhatsApp: <a href="https://wa.me/923295822495" className={styles.inlineLink}>+92 329 5822495</a></p>
                </div>
              </section>
            </article>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
