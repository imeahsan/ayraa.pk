import React from "react";
import { ProductForm } from "../ProductForm";
import Loading from "@/app/loading";

export const metadata = {
  title: "Publish New Product | Ayra Admin",
};

export default function NewProductPage() {
  return (
    <div>
      <React.Suspense fallback={<Loading />}>
        <ProductForm />
      </React.Suspense>
    </div>
  );
}
