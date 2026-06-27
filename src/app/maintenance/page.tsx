import React from "react";
import { Metadata } from "next";
import styles from "./maintenance.module.css";

export const metadata: Metadata = {
  title: "Under Maintenance | Ayraa Collection",
  description: "Ayraa is temporarily offline while we make updates to the storefront.",
  openGraph: {
    title: "Under Maintenance | Ayraa Collection",
    description: "Scheduled maintenance in progress.",
  },
};

export default function MaintenancePage() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.silkOverlay} />

      <main className={styles.content}>
        <h1 className={styles.brand}>Ayraa</h1>
        <hr className={styles.divider} />

        <div className={styles.gearEmblem}>
          <div className={styles.gearEmblemInner}>Maintenance</div>
        </div>

        <h2 className={styles.title}>Boutique Undergoing Refinement</h2>

        <p className={styles.subtitle}>
          We are updating the storefront and will return shortly with a cleaner shopping experience.
        </p>

        <div className={styles.infoBox}>
          <p className={styles.infoItem}>
            <strong>Helpline:</strong> +92 21 111-999-888
          </p>
          <p className={styles.infoItem}>
            <strong>Email Support:</strong>{" "}
            <a href="mailto:care@ayraa.pk">care@ayraa.pk</a>
          </p>
        </div>

        <footer className={styles.footer}>
          &copy; {new Date().getFullYear()} Ayraa Collection. All rights reserved.
        </footer>
      </main>
    </div>
  );
}
