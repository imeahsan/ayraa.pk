"use client";

import React, { useEffect, useState } from "react";
import { getClientTickerMessages } from "@/lib/storefront-client";
import styles from "./AnnouncementTicker.module.css";

const FALLBACK_MESSAGES = [
  "Free shipping on orders above PKR 5,000",
  "Handcrafted Heritage Pieces",
  "New Summer Lawn Arrivals",
  "Premium Fabrics — Lawn, Chiffon & Silk",
  "Nationwide Delivery Across Pakistan",
  "Authentic Eastern Craftsmanship",
];

interface AnnouncementTickerProps {
  initialMessages?: string[];
}

export const AnnouncementTicker: React.FC<AnnouncementTickerProps> = ({
  initialMessages,
}) => {
  const [messages, setMessages] = useState<string[]>(
    () => initialMessages && initialMessages.length > 0 ? initialMessages : FALLBACK_MESSAGES
  );

  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) return;
    let active = true;

    getClientTickerMessages()
      .then((data) => {
        if (active && data && data.length > 0) {
          setMessages(data);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch ticker announcements:", err);
      });

    return () => {
      active = false;
    };
  }, [initialMessages]);

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
