"use client";

import React, { useState } from "react";
import { Header } from "@/components/storefront/Header/Header";
import { Footer } from "@/components/storefront/Footer/Footer";
import styles from "./faq.module.css";

const FAQ_SECTIONS = [
  {
    category: "Orders & Payment",
    icon: "Orders",
    faqs: [
      {
        q: "How do I place an order?",
        a: "Browse a collection, choose a product, select a size if available, and proceed to checkout. We confirm COD orders by SMS or WhatsApp.",
      },
      {
        q: "What payment methods do you accept?",
        a: "Cash on Delivery is available across Pakistan.",
      },
      {
        q: "Can I modify or cancel my order?",
        a: "Contact us as soon as possible after placing the order. If it has not been processed yet, we will try to help.",
      },
    ],
  },
  {
    category: "Shipping & Delivery",
    icon: "Shipping",
    faqs: [
      {
        q: "How long does delivery take?",
        a: "Standard delivery across Pakistan usually takes 3 to 5 business days. Remote areas can take longer.",
      },
      {
        q: "What are the shipping charges?",
        a: "A flat shipping fee applies unless a free-shipping threshold is active on the product or promotion.",
      },
      {
        q: "Do you ship internationally?",
        a: "At the moment we ship within Pakistan only.",
      },
    ],
  },
  {
    category: "Returns & Exchanges",
    icon: "Returns",
    faqs: [
      {
        q: "What is your return policy?",
        a: "Eligible items can be returned or exchanged within 3 days of delivery if they are unused and in original condition.",
      },
      {
        q: "How do I start a return?",
        a: "Message us on WhatsApp with your order number and a short reason for the return.",
      },
      {
        q: "Do you offer cash refunds?",
        a: "No. Eligible returns are handled through exchange or store credit.",
      },
    ],
  },
  {
    category: "Products & Sizing",
    icon: "Sizing",
    faqs: [
      {
        q: "How do I find my size?",
        a: "Use the Size Guide page and check the fit notes on the product page before ordering.",
      },
      {
        q: "Are the colors accurate in photos?",
        a: "We try to keep images accurate, but screen and lighting differences can cause slight variation.",
      },
      {
        q: "Is stitching included with unstitched suits?",
        a: "No. Unstitched products are sold as fabric unless the product description says otherwise.",
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
        <span className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}>v</span>
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

      <main className="grow pt-20 md:pt-16">
        <div className={styles.hero}>
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>Support</span>
            <h1 className={styles.heroTitle}>Frequently Asked Questions</h1>
            <p className={styles.heroSub}>Answers for ordering, shipping, returns, and sizing.</p>
          </div>
        </div>

        <div className={styles.container}>
          <div className={styles.layout}>
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

              <div className={styles.helpCard}>
                <span className={styles.helpIcon}>Chat</span>
                <div>
                  <h3 className={styles.helpTitle}>Still have questions?</h3>
                  <p className={styles.helpText}>Message us on WhatsApp Monday to Saturday, 10AM to 6PM PKT.</p>
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
