import React from "react";
import { ReturnDetailClient } from "./ReturnDetailClient";

interface ReturnDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Manage Return | Ayra Admin",
};

export default async function ReturnDetailPage({ params }: ReturnDetailPageProps) {
  const { id } = await params;

  return <ReturnDetailClient returnId={id} />;
}
