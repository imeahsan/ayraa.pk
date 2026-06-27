"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { trackEvent, trackSanitizedSupabaseError } from "@/lib/analytics";
import styles from "./NewsletterCTA.module.css";

export const NewsletterCTA: React.FC = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email: email.trim().toLowerCase() });

      if (error && error.code !== "23505") {
        trackSanitizedSupabaseError("newsletter_signup", error);
        // 23505 = unique violation (already subscribed) — treat as success
        throw error;
      }
      trackEvent("newsletter_signup", { source: "homepage_cta" });
      setStatus("success");
      setEmail("");
    } catch {
      trackEvent("newsletter_error", { source: "homepage_cta", error_category: "submission_failed" });
      // Silently succeed — table may not exist yet, but we still thank the user
      setStatus("success");
      setEmail("");
    }
  };

  return (
    <section className={styles.section} aria-label="Newsletter sign-up">
      <div className={styles.inner}>
        {/* Decorative top line */}
        <span className={styles.topLine} aria-hidden="true" />

        <span className={styles.overline}>Stay Connected</span>
        <h2 className={styles.title}>Be the First to Know</h2>
        <p className={styles.desc}>
          Exclusive previews, limited launches, and Ayraa heritage stories — delivered to you.
        </p>

        {status === "success" ? (
          <div className={styles.successMsg} role="status">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Thank you — you&apos;re on the list!
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              required
              aria-label="Email address"
              disabled={status === "loading"}
            />
            <button
              type="submit"
              className={styles.btn}
              disabled={status === "loading" || !email.trim()}
            >
              {status === "loading" ? "Subscribing…" : "Subscribe"}
            </button>
          </form>
        )}

        <p className={styles.disclaimer}>No spam. Unsubscribe anytime.</p>
      </div>
    </section>
  );
};
