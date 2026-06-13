import React from "react";
import { ProductForm } from "../ProductForm";

export const metadata = {
  title: "Publish New Product | Ayra Admin",
};

export default function NewProductPage() {
  return (
    <div>
      <ProductForm />
    </div>
  );
}
