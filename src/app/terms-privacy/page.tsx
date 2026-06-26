import React from "react";
import { Metadata } from "next";
import { Header } from "@/components/storefront/Header/Header";
import { Footer } from "@/components/storefront/Footer/Footer";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import styles from "./terms-privacy.module.css";

export const metadata: Metadata = {
  title: "Terms & Privacy Policy | Ayra Collection",
  description:
    "Read Ayra Collection's Terms of Service and Privacy Policy. We are committed to protecting your data and delivering a transparent shopping experience.",
  alternates: { canonical: "/terms-privacy" },
  openGraph: {
    title: "Terms & Privacy Policy | Ayra Collection",
    description: "Terms of use and privacy policy for Ayra Collection.",
    type: "website",
  },
};

export default function TermsPrivacyPage() {
  const baseUrl = "https://ayraa.pk";
  const breadcrumbItems = [
    { name: "Home", item: "/" },
    { name: "Terms & Privacy", item: "/terms-privacy" },
  ];
  const lastUpdated = "June 2025";

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

            {/* Table of Contents */}
            <aside className={styles.toc}>
              <p className={styles.tocLabel}>On This Page</p>
              <nav>
                <a href="#terms" className={styles.tocLink}>Terms of Service</a>
                <a href="#privacy" className={styles.tocLink}>Privacy Policy</a>
                <a href="#cookies" className={styles.tocLink}>Cookie Policy</a>
                <a href="#contact-legal" className={styles.tocLink}>Contact Us</a>
              </nav>
            </aside>

            {/* Content */}
            <article className={styles.content}>

              {/* Terms of Service */}
              <section id="terms" className={styles.section}>
                <h2 className={styles.sectionTitle}>Terms of Service</h2>
                <p className={styles.intro}>
                  By accessing or using the Ayra Collection website (<strong>ayraa.pk</strong>), you agree to be bound by
                  these Terms of Service. Please read them carefully before placing an order.
                </p>

                <h3 className={styles.subTitle}>1. Acceptance of Terms</h3>
                <p className={styles.para}>
                  These Terms govern your use of our website and services. By browsing, registering, or purchasing,
                  you confirm that you are at least 18 years of age and legally capable of entering into a binding agreement.
                </p>

                <h3 className={styles.subTitle}>2. Products &amp; Pricing</h3>
                <p className={styles.para}>
                  All products listed on our website are subject to availability. We reserve the right to discontinue
                  any product at any time. Prices are listed in Pakistani Rupees (PKR) and are inclusive of applicable taxes.
                  We reserve the right to change prices without prior notice; however, any changes will not affect
                  already-confirmed orders.
                </p>

                <h3 className={styles.subTitle}>3. Orders &amp; Payment</h3>
                <p className={styles.para}>
                  Orders are accepted on a Cash on Delivery (COD) basis only. An order confirmation SMS will be sent
                  upon successful order placement. We reserve the right to cancel any order suspected of fraud or
                  abuse, or if stock becomes unavailable.
                </p>

                <h3 className={styles.subTitle}>4. Shipping &amp; Delivery</h3>
                <p className={styles.para}>
                  We deliver across Pakistan. Delivery timelines are estimates and may vary due to logistics conditions.
                  Ayra is not responsible for delays caused by third-party couriers, natural disasters, or events
                  beyond our reasonable control.
                </p>

                <h3 className={styles.subTitle}>5. Returns &amp; Refunds</h3>
                <p className={styles.para}>
                  Returns are accepted within 3 days of delivery for eligible items in original, unused condition.
                  We do not offer cash refunds; eligible returns are processed as store credit or exchanges.
                  Please refer to our <a href="/shipping-returns" className={styles.inlineLink}>Shipping &amp; Returns</a> page for full details.
                </p>

                <h3 className={styles.subTitle}>6. Intellectual Property</h3>
                <p className={styles.para}>
                  All content on this website—including text, images, logos, product photography, and design—is the
                  exclusive intellectual property of Ayra Collection. Unauthorized reproduction, distribution,
                  or use without written permission is strictly prohibited.
                </p>

                <h3 className={styles.subTitle}>7. Limitation of Liability</h3>
                <p className={styles.para}>
                  Ayra Collection shall not be liable for any indirect, incidental, or consequential damages
                  arising from the use of our website or products. Our total liability shall not exceed the
                  value of the order in question.
                </p>

                <h3 className={styles.subTitle}>8. Governing Law</h3>
                <p className={styles.para}>
                  These Terms are governed by the laws of the Islamic Republic of Pakistan. Any disputes
                  arising from these Terms shall be subject to the exclusive jurisdiction of courts in Lahore, Pakistan.
                </p>
              </section>

              <hr className={styles.divider} />

              {/* Privacy Policy */}
              <section id="privacy" className={styles.section}>
                <h2 className={styles.sectionTitle}>Privacy Policy</h2>
                <p className={styles.intro}>
                  Your privacy is important to us. This policy explains what data we collect, why we collect it,
                  and how we use and protect it.
                </p>

                <h3 className={styles.subTitle}>1. Information We Collect</h3>
                <p className={styles.para}>
                  When you place an order, we collect your name, phone number, email address, and delivery address.
                  We may also collect technical data such as your browser type, IP address, and pages visited,
                  through standard server logs and analytics tools.
                </p>

                <h3 className={styles.subTitle}>2. How We Use Your Information</h3>
                <ul className={styles.list}>
                  <li>To process and deliver your orders</li>
                  <li>To send order confirmations and delivery updates via SMS</li>
                  <li>To respond to your customer service enquiries</li>
                  <li>To send promotional communications (if you have opted in)</li>
                  <li>To improve our website and product offerings</li>
                </ul>

                <h3 className={styles.subTitle}>3. Data Sharing</h3>
                <p className={styles.para}>
                  We do not sell, trade, or rent your personal information to third parties. We may share your
                  delivery details with our logistics partners solely for the purpose of fulfilling your order.
                  These partners are contractually bound to keep your data confidential.
                </p>

                <h3 className={styles.subTitle}>4. Data Retention</h3>
                <p className={styles.para}>
                  We retain your personal data for as long as necessary to fulfill the purposes outlined in
                  this policy, or as required by applicable law. You may request deletion of your data at
                  any time by contacting us.
                </p>

                <h3 className={styles.subTitle}>5. Your Rights</h3>
                <p className={styles.para}>
                  You have the right to access, correct, or delete your personal data held by us.
                  You may also opt out of marketing communications at any time by replying STOP to any
                  SMS or emailing us at <a href="mailto:privacy@ayraa.pk" className={styles.inlineLink}>privacy@ayraa.pk</a>.
                </p>

                <h3 className={styles.subTitle}>6. Security</h3>
                <p className={styles.para}>
                  We implement appropriate technical and organizational measures to protect your personal
                  information against unauthorized access, disclosure, or destruction. However, no method of
                  internet transmission is 100% secure, and we cannot guarantee absolute security.
                </p>
              </section>

              <hr className={styles.divider} />

              {/* Cookie Policy */}
              <section id="cookies" className={styles.section}>
                <h2 className={styles.sectionTitle}>Cookie Policy</h2>
                <p className={styles.para}>
                  Our website uses cookies to improve your browsing experience and analyze site traffic.
                  Cookies are small data files stored on your device. We use the following types of cookies:
                </p>
                <ul className={styles.list}>
                  <li><strong>Essential Cookies:</strong> Required for core website functionality such as shopping cart and session management.</li>
                  <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our website (e.g., Google Analytics).</li>
                  <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements on third-party platforms.</li>
                </ul>
                <p className={styles.para}>
                  You may disable cookies through your browser settings. Note that disabling certain cookies
                  may affect the functionality of the website.
                </p>
              </section>

              <hr className={styles.divider} />

              {/* Contact */}
              <section id="contact-legal" className={styles.section}>
                <h2 className={styles.sectionTitle}>Contact Us</h2>
                <p className={styles.para}>
                  For any legal enquiries, privacy requests, or data concerns, please contact us:
                </p>
                <div className={styles.contactBlock}>
                  <p><strong>Ayra Collection</strong></p>
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
