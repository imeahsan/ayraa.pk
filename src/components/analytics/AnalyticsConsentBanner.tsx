"use client";

import React, { useEffect, useState } from "react";
import {
  getAnalyticsConsent,
  isAnalyticsEnabled,
  setAnalyticsConsent,
  trackPageView,
} from "@/lib/analytics";
import styles from "./AnalyticsConsentBanner.module.css";

export function AnalyticsConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(isAnalyticsEnabled && getAnalyticsConsent() === null);
  }, []);

  if (!visible) return null;

  const accept = () => {
    setAnalyticsConsent("accepted");
    setVisible(false);
    trackPageView(window.location.href, document.title, window.location.pathname);
  };

  const reject = () => {
    setAnalyticsConsent("rejected");
    setVisible(false);
  };

  return (
    <div className={styles.banner} role="dialog" aria-live="polite" aria-label="Analytics consent">
      <h2 className={styles.title}>Analytics preferences</h2>
      <p className={styles.text}>
        We use privacy-conscious Google Analytics to understand storefront performance and shopping
        journeys. No names, emails, phone numbers, or addresses are sent.
      </p>
      <div className={styles.actions}>
        <button type="button" className={styles.button} onClick={reject}>
          Reject
        </button>
        <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={accept}>
          Accept
        </button>
      </div>
    </div>
  );
}
