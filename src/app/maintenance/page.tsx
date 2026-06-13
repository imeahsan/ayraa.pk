import React from "react";
import { Metadata } from "next";
import styles from "./maintenance.module.css";

export const metadata: Metadata = {
  title: "Under Maintenance | Ayraa Collection",
  description: "We are currently performing scheduled maintenance on our online boutique to bring you our latest collections. We will be back online shortly.",
  openGraph: {
    title: "Under Maintenance | Ayraa Collection",
    description: "Scheduled maintenance in progress. We will be back online shortly.",
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
          <div className={styles.gearEmblemInner}>
            ⚙️
          </div>
        </div>

        <h2 className={styles.title}>Boutique Undergoing Refinement</h2>
        
        <p className={styles.subtitle}>
          We are currently updating our online studio with the latest luxury prêt-à-porter 
          and bespoke collections. Our online services will return shortly.
        </p>

        <div className={styles.infoBox}>
          <p className={styles.infoItem}>
            <strong>Helpline:</strong> +92 21 111-999-888
          </p>
          <p className={styles.infoItem}>
            <strong>Email Support:</strong>{" "}
            <a href="mailto:care@ayraacollection.com">care@ayraacollection.com</a>
          </p>
        </div>

        <footer className={styles.footer}>
          &copy; {new Date().getFullYear()} Ayraa Collection. All rights reserved.
        </footer>
      </main>
    </div>
  );
}
