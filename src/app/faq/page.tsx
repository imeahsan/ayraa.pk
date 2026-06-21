"use client";

import React, { useState } from "react";
import { Header } from "@/components/storefront/Header/Header";
import { Footer } from "@/components/storefront/Footer/Footer";
import styles from "./faq.module.css";

const FAQ_SECTIONS = [
  {
    category: "Orders & Payment",
    icon: "🛒",
    faqs: [
      {
        q: "How do I place an order?",
        a: "Browse our collections, select your item and size, then click 'Add to Cart'. Proceed to checkout, enter your delivery details, and confirm your order. You'll receive an SMS confirmation immediately.",
      },
      {
        q: "What payment methods do you accept?",
        a: "We exclusively offer Cash on Delivery (COD) across Pakistan. Pay when your parcel arrives—no advance payment or card details required.",
      },
      {
        q: "Can I modify or cancel my order after placing it?",
        a: "Orders can be modified or cancelled within 2 hours of placement. Please contact us immediately via WhatsApp with your order number. Once dispatched, cancellations are no longer possible.",
      },
      {
        q: "Is there a minimum order amount?",
        a: "There is no minimum order amount. However, orders above PKR 5,000 qualify for free shipping.",
      },
    ],
  },
  {
    category: "Shipping & Delivery",
    icon: "🚚",
    faqs: [
      {
        q: "How long does delivery take?",
        a: "Standard delivery across Pakistan takes 3–5 business days. Remote areas may take up to 7 business days. Timelines exclude weekends and public holidays.",
      },
      {
        q: "What are the shipping charges?",
        a: "A flat shipping fee of PKR 200 applies. Orders above PKR 5,000 enjoy free shipping anywhere in Pakistan.",
      },
      {
        q: "Do you ship internationally?",
        a: "We currently only ship within Pakistan. International shipping is planned for a future phase. Follow us on Instagram for updates.",
      },
      {
        q: "How do I track my order?",
        a: "Once your order is dispatched, you will receive an SMS with your tracking number and courier details. You can track via the courier's website or contact us for an update.",
      },
    ],
  },
  {
    category: "Returns & Exchanges",
    icon: "🔄",
    faqs: [
      {
        q: "What is your return policy?",
        a: "We accept returns and exchanges within 3 days of delivery. Items must be unused, in their original packaging, with all tags attached. See our Shipping & Returns page for full details.",
      },
      {
        q: "How do I initiate a return?",
        a: "Contact us on WhatsApp within 3 days of receiving your order. Share your order number and photos of the item. Our team will guide you through the process.",
      },
      {
        q: "Do you offer cash refunds?",
        a: "We do not offer cash refunds. Eligible returns are processed as store credit or exchanges. Store credit is issued within 5–7 business days of receiving the returned item.",
      },
      {
        q: "What if I received a damaged or wrong item?",
        a: "We sincerely apologize for any inconvenience. Please contact us within 24 hours of delivery with photos of the item. We will arrange an immediate exchange or replacement at no additional cost.",
      },
    ],
  },
  {
    category: "Products & Sizing",
    icon: "👗",
    faqs: [
      {
        q: "How do I find my correct size?",
        a: "Please refer to our detailed Size Guide page, which includes measurement charts for all categories including pret, lawn suits, hijabs, and bedding. If unsure, our stylists can assist you via WhatsApp.",
      },
      {
        q: "Are the colors accurate in the photos?",
        a: "We strive to represent colors as accurately as possible. However, slight variations may occur due to screen calibration and photographic lighting. If you need a color reference, contact us on WhatsApp.",
      },
      {
        q: "Is stitching included with unstitched suits?",
        a: "Unstitched suits are sold as fabric only. Stitching is not included. We can recommend skilled tailors in major cities upon request.",
      },
      {
        q: "Do you offer custom stitching or embroidery?",
        a: "We do not offer custom stitching at this time. All Ayra pret pieces are pre-stitched and ready to wear.",
      },
    ],
  },
  {
    category: "Care & Maintenance",
    icon: "✨",
    faqs: [
      {
        q: "How should I wash my Ayra garments?",
        a: "Most of our garments require gentle hand washing in cold water or dry cleaning, especially embroidered and silk pieces. Always follow the care label on each garment.",
      },
      {
        q: "How do I care for the bedding sets?",
        a: "Machine wash at 30°C on a gentle cycle. Avoid bleach and tumble dry at low heat. Iron on medium heat while damp for best results.",
      },
      {
        q: "How should I store seasonal garments?",
        a: "Store clean, dry garments in breathable cotton bags. Avoid plastic covers for silk or embroidered pieces. Keep away from direct sunlight and moisture.",
      },
    ],
  },
];

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`${styles.item} ${open ? styles.itemOpen : ""}`}>
      <button
        className={styles.question}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{q}</span>
        <span className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}>▾</span>
      </button>
      {open && (
        <div className={styles.answer}>
          <p>{a}</p>
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <div className="flex flex-col min-h-screen bg-bg transition-colors duration-500 ease-out">
      <Header />

      <main className="grow">
        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>Support</span>
            <h1 className={styles.heroTitle}>Frequently Asked Questions</h1>
            <p className={styles.heroSub}>
              Everything you need to know about ordering, shipping, returns, and our products.
            </p>
          </div>
        </div>

        <div className={styles.container}>
          <div className={styles.layout}>
            {/* Category Sidebar */}
            <aside className={styles.sidebar}>
              <p className={styles.sidebarLabel}>Browse by Topic</p>
              <nav className={styles.sidebarNav}>
                {FAQ_SECTIONS.map((section, i) => (
                  <button
                    key={section.category}
                    className={`${styles.sidebarBtn} ${activeCategory === i ? styles.sidebarBtnActive : ""}`}
                    onClick={() => setActiveCategory(i)}
                  >
                    <span>{section.icon}</span>
                    <span>{section.category}</span>
                  </button>
                ))}
              </nav>
            </aside>

            {/* FAQ Content */}
            <div className={styles.content}>
              {FAQ_SECTIONS.map((section, i) => (
                <section
                  key={section.category}
                  className={`${styles.faqSection} ${activeCategory === i ? styles.faqSectionVisible : styles.faqSectionHidden}`}
                  aria-hidden={activeCategory !== i}
                >
                  <div className={styles.faqHeader}>
                    <span className={styles.faqIcon}>{section.icon}</span>
                    <h2 className={styles.faqTitle}>{section.category}</h2>
                  </div>
                  <div className={styles.accordion}>
                    {section.faqs.map((faq) => (
                      <AccordionItem key={faq.q} q={faq.q} a={faq.a} />
                    ))}
                  </div>
                </section>
              ))}

              {/* Help CTA */}
              <div className={styles.helpCard}>
                <span className={styles.helpIcon}>💬</span>
                <div>
                  <h3 className={styles.helpTitle}>Still have questions?</h3>
                  <p className={styles.helpText}>Our team is ready to help you on WhatsApp, Monday–Saturday, 10AM–6PM PST.</p>
                </div>
                <a
                  href="https://wa.me/923295822495"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.helpBtn}
                >
                  Chat Now
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
