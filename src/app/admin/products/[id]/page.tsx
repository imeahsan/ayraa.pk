import React from "react";
import { ProductForm } from "../ProductForm";
import Loading from "@/app/loading";

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
      <React.Suspense fallback={<Loading />}>
        <ProductForm productId={id} />
      </React.Suspense>
    </div>
  );
}
