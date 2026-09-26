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
      <React.Suspense fallback={<p className="font-body text-sm text-admin-text-sub text-center py-12">Loading product details...</p>}>
        <ProductForm productId={id} />
      </React.Suspense>
    </div>
  );
}
