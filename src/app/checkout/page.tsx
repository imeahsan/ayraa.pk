import React from "react";
import { Header } from "@/components/storefront/Header/Header";
import { Footer } from "@/components/storefront/Footer/Footer";
import { CheckoutForm } from "./CheckoutForm";
import styles from "./checkout.module.css";

export const metadata = {
  title: "Checkout | Ayraa Premium Collection",
  description: "Securely place your order with Cash on Delivery options.",
};

export default function CheckoutPage() {
  return (
    <div className={styles.pageWrapper}>
      <Header />
      <main className={`${styles.mainContent} pt-20 md:pt-16`}>
        <div className={styles.container}>
          <CheckoutForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
