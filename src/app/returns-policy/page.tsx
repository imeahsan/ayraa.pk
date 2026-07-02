import React from "react";
import { Metadata } from "next";
import { Header } from "@/components/storefront/Header/Header";
import { Footer } from "@/components/storefront/Footer/Footer";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import styles from "../terms-privacy/terms-privacy.module.css";

export const metadata: Metadata = {
  title: "Returns Policy | Ayraa Collection",
  description:
    "Read Ayraa's strict returns policy, including non-acceptable reasons such as change of mind or not liking the item after delivery.",
  alternates: { canonical: "/returns-policy" },
  openGraph: {
    title: "Returns Policy | Ayraa Collection",
    description: "Strict returns eligibility and non-returnable cases for Ayraa orders.",
    type: "website",
  },
};

const NOT_ACCEPTED = [
  "Change of mind after purchase",
  "I did not like it after delivery",
  "Color or design preference change after ordering",
  "Minor variation in screen display versus real fabric tone",
  "Used, worn, washed, altered, or fragranced items",
  "Items returned without original tags, packaging, or invoice reference",
  "Sale, discounted, or promotional items",
  "Custom stitched, altered, or made-to-order pieces",
];

const ACCEPTED = [
  "Wrong item delivered",
  "Wrong size sent by our team versus confirmed order",
  "Manufacturing defect clearly visible on arrival",
  "Damage received before first use",
  "Incomplete order received",
];

export default function ReturnsPolicyPage() {
  const baseUrl = "https://store.ayraa.pk";
  const breadcrumbItems = [
    { name: "Home", item: "/" },
    { name: "Returns Policy", item: "/returns-policy" },
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
            <span className={styles.heroBadge}>Customer Care</span>
            <h1 className={styles.heroTitle}>Returns Policy</h1>
            <p className={styles.heroSub}>Last updated: {lastUpdated}</p>
          </div>
        </div>

        <div className={styles.container}>
          <div className={styles.layout}>
            <aside className={styles.toc}>
              <p className={styles.tocLabel}>On This Page</p>
              <nav>
                <a href="#policy-position" className={styles.tocLink}>Policy Position</a>
                <a href="#accepted-returns" className={styles.tocLink}>Accepted Returns</a>
                <a href="#not-accepted" className={styles.tocLink}>Not Accepted</a>
                <a href="#process" className={styles.tocLink}>Process</a>
                <a href="#contact-returns" className={styles.tocLink}>Contact</a>
              </nav>
            </aside>

            <article className={styles.content}>
              <section id="policy-position" className={styles.section}>
                <h2 className={styles.sectionTitle}>Strict Returns Policy</h2>
                <p className={styles.intro}>
                  Ayraa accepts return or exchange requests only where there is a genuine issue with the order received.
                </p>
                <p className={styles.para}>
                  Returns are not treated as trial purchases. Requests based on personal preference, change of mind, or simply not liking the item after delivery are not accepted.
                </p>
              </section>

              <hr className={styles.divider} />

              <section id="accepted-returns" className={styles.section}>
                <h2 className={styles.sectionTitle}>When We May Accept a Return</h2>
                <ul className={styles.list}>
                  {ACCEPTED.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className={styles.para}>
                  All claims are reviewed after our team checks the order details, supporting photos, and item condition.
                </p>
              </section>

              <hr className={styles.divider} />

              <section id="not-accepted" className={styles.section}>
                <h2 className={styles.sectionTitle}>Reasons We Do Not Accept</h2>
                <p className={styles.intro}>
                  The following reasons are strictly non-returnable and non-exchangeable:
                </p>
                <ul className={styles.list}>
                  {NOT_ACCEPTED.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>

              <hr className={styles.divider} />

              <section id="process" className={styles.section}>
                <h2 className={styles.sectionTitle}>Review Process</h2>
                <h3 className={styles.subTitle}>1. Reporting Window</h3>
                <p className={styles.para}>
                  Report the issue within 3 days of delivery with your order number and clear photos.
                </p>
                <h3 className={styles.subTitle}>2. Inspection</h3>
                <p className={styles.para}>
                  The item must remain unused, unwashed, and in original condition until our team reviews the case.
                </p>
                <h3 className={styles.subTitle}>3. Outcome</h3>
                <p className={styles.para}>
                  If approved, Ayraa may offer an exchange, store credit, or another resolution at its discretion depending on stock and issue type.
                </p>
                <h3 className={styles.subTitle}>4. Final Review</h3>
                <p className={styles.para}>
                  Ayraa reserves the right to refuse any request that does not meet the policy conditions above.
                </p>
              </section>

              <hr className={styles.divider} />

              <section id="contact-returns" className={styles.section}>
                <h2 className={styles.sectionTitle}>Contact for Eligible Claims</h2>
                <p className={styles.para}>
                  To report an eligible issue, contact customer care with your order ID and images of the problem.
                </p>
                <div className={styles.contactBlock}>
                  <p><strong>Ayraa Collection</strong></p>
                  <p>Email: <a href="mailto:care@ayraa.pk" className={styles.inlineLink}>care@ayraa.pk</a></p>
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
