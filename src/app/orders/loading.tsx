import React from "react";
import { Header } from "@/components/storefront/Header/Header";
import { Footer } from "@/components/storefront/Footer/Footer";
import { Breadcrumb } from "@/components/storefront/Breadcrumb/Breadcrumb";
import { LuxuryLoader } from "@/components/common/LuxuryLoader";
import styles from "./orders.module.css";

export default function OrdersLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-bg">
      <Header />

      <main className="grow pt-20 md:pt-16">
        <div className={styles.container}>
          <Breadcrumb items={[{ label: "My Orders", url: "/orders" }]} />
          <h1 className={styles.pageTitle}>My Orders</h1>
          <LuxuryLoader label="Loading your orders history..." size="md" variant="page" />
        </div>
      </main>

      <Footer />
    </div>
  );
}
