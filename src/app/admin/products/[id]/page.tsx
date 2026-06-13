import React from "react";
import { ProductForm } from "../ProductForm";

interface EditProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Edit Product | Ayra Admin",
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;

  return (
    <div>
      <ProductForm productId={id} />
    </div>
  );
}
