import React from "react";
import { OrderDetailClient } from "./OrderDetailClient";

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
    <div>
      <OrderDetailClient orderId={id} />
    </div>
  );
}
