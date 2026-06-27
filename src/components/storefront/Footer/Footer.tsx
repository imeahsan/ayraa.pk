"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Category } from "@/types";
import styles from "./Footer.module.css";

const FALLBACK_COLLECTION_LINKS = [
  { label: "Lawn", href: "/collections" },
  { label: "Pret", href: "/collections" },
  { label: "Festive", href: "/collections" },
  { label: "Home", href: "/collections" },
];

export const Footer: React.FC = () => {
  const [collections, setCollections] = useState<Array<{ label: string; href: string }>>(FALLBACK_COLLECTION_LINKS);

  useEffect(() => {
    let active = true;

    const loadCollections = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .eq("is_active", true)
          .is("parent_id", null)
          .order("sort_order", { ascending: true });

        if (error || !data || data.length === 0 || !active) return;

        const mapped = (data as Category[])
          .filter((category) => category.show_in_header || category.name)
          .slice(0, 4)
          .map((category) => ({
            label: category.header_label?.trim() || category.name,
            href: `/collections/${category.slug}`,
          }));

        if (mapped.length > 0) {
          setCollections(mapped);
        }
      } catch {
        // Keep fallback links.
      }
    };

    loadCollections();
    return () => {
      active = false;
    };
  }, []);

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.brandCol}>
            <h3 className={styles.logo}>AYRAA</h3>
            <p className={styles.desc}>
              Pakistani lawn, pret, festive edits, and home pieces designed for everyday grace.
            </p>
            <form className={styles.newsletterForm} onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email"
                className={styles.input}
                required
                aria-label="Newsletter email subscription"
              />
              <button type="submit" className={styles.subscribeBtn}>
                Subscribe
              </button>
            </form>
          </div>

          <div className={styles.col}>
            <h4 className={styles.heading}>Collections</h4>
            <ul className={styles.list}>
              {collections.map((item) => (
                <li key={`${item.label}-${item.href}`}>
                  <Link href={item.href} className={styles.link}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.col}>
            <h4 className={styles.heading}>Customer Care</h4>
            <ul className={styles.list}>
              <li>
                <Link href="/contact" className={styles.link}>
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/shipping-returns" className={styles.link}>
                  Shipping & Returns
                </Link>
              </li>
              <li>
                <Link href="/faq" className={styles.link}>
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/size-guide" className={styles.link}>
                  Size Guide
                </Link>
              </li>
            </ul>
          </div>

          <div className={styles.col}>
            <h4 className={styles.heading}>Our Brand</h4>
            <ul className={styles.list}>
              <li>
                <Link href="/about" className={styles.link}>
                  Our Story
                </Link>
              </li>
              <li>
                <Link href="/editorial" className={styles.link}>
                  Editorial Journal
                </Link>
              </li>
              <li>
                <Link href="/careers" className={styles.link}>
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/terms-privacy" className={styles.link}>
                  Terms & Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <hr className={styles.divider} />

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            &copy; {new Date().getFullYear()} Ayraa Collection. All rights reserved.
          </p>
          <div className={styles.metaList}>
            <span>
              Region: <span className="font-semibold text-gold">Pakistan (PKR)</span>
            </span>
            <span>Payment: Cash on Delivery (COD)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
