"use client";

import React from "react";
import Link from "next/link";
import styles from "./Footer.module.css";

export const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Newsletter Column */}
          <div className={styles.brandCol}>
            <h3 className={styles.logo}>AYRAA</h3>
            <p className={styles.desc}>
              Exquisite Eastern pret and luxury couture. Crafting timeless silhouettes
              infused with traditional heritage and contemporary design aesthetics.
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

          {/* Links Column 1 */}
          <div className={styles.col}>
            <h4 className={styles.heading}>Collections</h4>
            <ul className={styles.list}>
              <li>
                <Link href="/collections/lawn-prints" className={styles.link}>
                  Lawn Prints
                </Link>
              </li>
              <li>
                <Link href="/collections/garments" className={styles.link}>
                  Garments
                </Link>
              </li>
              <li>
                <Link href="/collections/bedding" className={styles.link}>
                  Bedding
                </Link>
              </li>
              <li>
                <Link href="/collections/hijab-collection" className={styles.link}>
                  Hijab Collection
                </Link>
              </li>
            </ul>
          </div>


          {/* Links Column 2 */}
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

          {/* Links Column 3 */}
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

        {/* Footer Bottom info */}
        <div className={styles.bottom}>
          <p className={styles.copyright}>
            &copy; {new Date().getFullYear()} Ayraa Premium Collection. All rights
            reserved.
          </p>
          <div className={styles.metaList}>
            <span>Region: <span className="font-semibold text-gold">Pakistan (PKR ₨)</span></span>
            <span>Payment: Cash on Delivery (COD)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
