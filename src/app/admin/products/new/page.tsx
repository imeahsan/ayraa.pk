import React from "react";
import { ProductForm } from "../ProductForm";

export const metadata = {
  title: "Publish New Product | Ayra Admin",
};

export default function NewProductPage() {
  return (
    <div>
      <React.Suspense fallback={<p className="font-body text-sm text-admin-text-sub text-center py-12">Loading product form...</p>}>
        <ProductForm />
      </React.Suspense>
    </div>
  );
}
