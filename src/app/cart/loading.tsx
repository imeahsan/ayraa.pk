import React from "react";
import { Header } from "@/components/storefront/Header/Header";
import { Footer } from "@/components/storefront/Footer/Footer";
import { Breadcrumb } from "@/components/storefront/Breadcrumb/Breadcrumb";
import { LuxuryLoader } from "@/components/common/LuxuryLoader";
import styles from "./cart.module.css";

export default function CartLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Header />

      <main className="grow pt-20 md:pt-16">
        <div className={styles.container}>
          <Breadcrumb items={[{ label: "Shopping Bag", url: "/cart" }]} />
          <h1 className={styles.pageTitle}>Your Shopping Bag</h1>
          <LuxuryLoader label="Loading your shopping bag..." size="md" variant="page" />
        </div>
      </main>

      <Footer />
    </div>
  );
}
