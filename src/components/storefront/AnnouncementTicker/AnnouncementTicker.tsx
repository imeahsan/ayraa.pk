"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
  const supabase = createClient();

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data, error } = await supabase
          .from("ticker_announcements")
          .select("message")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });

        if (!error && data && data.length > 0) {
          setMessages(data.map(d => d.message));
        }
      } catch (err) {
        console.error("Failed to fetch ticker announcements:", err);
      }
    };

    fetchAnnouncements();
  }, [supabase]);

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
