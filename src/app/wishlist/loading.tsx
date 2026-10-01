import React from "react";
import { Header } from "@/components/storefront/Header/Header";
import { Footer } from "@/components/storefront/Footer/Footer";
import { Breadcrumb } from "@/components/storefront/Breadcrumb/Breadcrumb";
import { LuxuryLoader } from "@/components/common/LuxuryLoader";
import { ProductCardSkeleton } from "@/components/common/ProductCardSkeleton";
import styles from "./wishlist.module.css";

export default function WishlistLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-bg">
      <Header />

      <main className="grow pt-20 md:pt-16">
        <div className={styles.container}>
          <Breadcrumb items={[{ label: "Wishlist", url: "/wishlist" }]} />

          <div className={styles.hero}>
            <span className={styles.kicker}>Saved for later</span>
            <h1 className={styles.title}>Your Wishlist</h1>
            <p className={styles.copy}>
              Keep track of lawn, pret, and festive pieces you want to come back to.
            </p>
          </div>

          <div style={{ marginBottom: "32px" }}>
            <LuxuryLoader label="Loading your wishlist..." size="md" variant="inline" />
          </div>

          <ProductCardSkeleton count={4} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
