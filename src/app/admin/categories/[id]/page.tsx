import React from "react";
import { CategoryForm } from "../CategoryForm";

interface EditCategoryPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Edit Collection | Ayra Admin",
};

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { id } = await params;

  return <CategoryForm categoryId={id} />;
}
