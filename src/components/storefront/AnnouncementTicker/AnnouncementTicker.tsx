"use client";

import React, { useEffect, useState } from "react";
import styles from "./AnnouncementTicker.module.css";

const FALLBACK_MESSAGES = [
  "Free shipping on orders above PKR 5,000",
  "Handcrafted Heritage Pieces",
  "New Summer Lawn Arrivals",
  "Premium Fabrics — Lawn, Chiffon & Silk",
  "Nationwide Delivery Across Pakistan",
  "Authentic Eastern Craftsmanship",
];

export const AnnouncementTicker: React.FC = () => {
  const [messages, setMessages] = useState<string[]>(FALLBACK_MESSAGES);

  useEffect(() => {
    let active = true;

    const fetchAnnouncements = async () => {
      try {
        const response = await fetch("/api/storefront/ticker");
        if (!response.ok) return;

        const data = (await response.json()) as string[];
        if (active && data.length > 0) {
          setMessages(data);
        }
      } catch (err) {
        console.error("Failed to fetch ticker announcements:", err);
      }
    };

    fetchAnnouncements();
    return () => {
      active = false;
    };
  }, []);

  // Duplicate so the marquee loops seamlessly
  const items = [...messages, ...messages];

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
