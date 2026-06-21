"use client";

import React from "react";
import styles from "./AnnouncementTicker.module.css";

const MESSAGES = [
  "Free shipping on orders above PKR 5,000",
  "Handcrafted Heritage Pieces",
  "New Summer Lawn Arrivals",
  "Premium Fabrics — Lawn, Chiffon & Silk",
  "Nationwide Delivery Across Pakistan",
  "Authentic Eastern Craftsmanship",
];

export const AnnouncementTicker: React.FC = () => {
  // Duplicate so the marquee loops seamlessly
  const items = [...MESSAGES, ...MESSAGES];

  return (
    <div className={styles.ticker} aria-label="Announcements">
      <div className={styles.track}>
        {items.map((msg, i) => (
          <span key={i} className={styles.item}>
            {msg}
            <span className={styles.divider} aria-hidden="true">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
};
