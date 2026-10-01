import React, { Suspense } from "react";
import { OrderDetailClient } from "./OrderDetailClient";
import styles from "../../admin.module.css";

interface OrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Manage Order | Ayra Admin",
};

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner} />
          <p>Loading order details...</p>
        </div>
      }
    >
      <OrderDetailClient orderId={id} />
    </Suspense>
  );
}

