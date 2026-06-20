import React, { cache } from "react";
import { Metadata } from "next";
import { Header } from "@/components/storefront/Header/Header";
import { Footer } from "@/components/storefront/Footer/Footer";
import { createClient } from "@/lib/supabase/server";
import { Product } from "@/types";
import { CollectionClient } from "./CollectionClient";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

// Fallback Mock data for categories
const CATEGORY_NAMES: Record<string, string> = {
  "ready-to-wear": "Ready To Wear",
  "formal": "Luxury Formal",
  "pret": "Pret Collection",
  "unstitched": "Unstitched Suitings",
  "eid-edit": "Eid Edit",
  "luxury-pret": "Luxury Pret",
};

const MOCK_PRODUCTS: Record<string, Product[]> = {
  "ready-to-wear": [
    {
      id: "p1",
      name: "Noir Silk Blouse",
      slug: "noir-silk-blouse",
      description: "A sleek black ready-to-wear blouse crafted from premium raw silk, featuring structured tailoring.",
      price: 18500,
      compare_at_price: 22000,
      sku: "AYR-NOI-01",
      category_id: "ready-to-wear",
      is_active: true,
      is_featured: true,
      fabric: "Raw Silk",
      color: "Black",
      includes: "Blouse Only",
      care_instructions: "Dry clean only",
      meta_title: null,
      meta_description: null,
      created_at: new Date().toISOString(),
      images: [
        {
          id: "img1",
          product_id: "p1",
          url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80",
          alt_text: "Noir Silk Blouse",
          sort_order: 1,
          is_primary: true,
        },
      ],
      variants: [
        { id: "v1-s", product_id: "p1", size: "S", stock_quantity: 12, is_available: true },
        { id: "v1-m", product_id: "p1", size: "M", stock_quantity: 15, is_available: true },
      ],
    },
    {
      id: "p3",
      name: "Olive Linen Set",
      slug: "olive-linen-set",
      description: "A modern relaxed-fit linen two-piece set in a rich olive tone with buttoned cuffs.",
      price: 21000,
      compare_at_price: 25000,
      sku: "AYR-OLI-03",
      category_id: "ready-to-wear",
      is_active: true,
      is_featured: true,
      fabric: "Premium Linen",
      color: "Olive Green",
      includes: "Shirt, Trousers",
      care_instructions: "Hand wash cold",
      meta_title: null,
      meta_description: null,
      created_at: new Date().toISOString(),
      images: [
        {
          id: "img3",
          product_id: "p3",
          url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80",
          alt_text: "Olive Linen Set",
          sort_order: 1,
          is_primary: true,
        },
      ],
      variants: [
        { id: "v3-s", product_id: "p3", size: "S", stock_quantity: 10, is_available: true },
        { id: "v3-m", product_id: "p3", size: "M", stock_quantity: 12, is_available: true },
      ],
    },
  ],
  "formal": [
    {
      id: "p5",
      name: "Midnight Chiffon Suit",
      slug: "midnight-chiffon-suit",
      description: "Exude effortless elegance in this hand-embellished midnight chiffon suit. Featuring intricate detailing and a flowing silhouette.",
      price: 85000,
      compare_at_price: 95000,
      sku: "AYR-MCF-05",
      category_id: "formal",
      is_active: true,
      is_featured: true,
      fabric: "Pure Chiffon",
      color: "Midnight Black",
      includes: "Shirt, Dupatta, Trousers, Inner",
      care_instructions: "Dry clean only",
      meta_title: null,
      meta_description: null,
      created_at: new Date().toISOString(),
      images: [
        {
          id: "img5",
          product_id: "p5",
          url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80",
          alt_text: "Midnight Chiffon Suit",
          sort_order: 1,
          is_primary: true,
        },
      ],
      variants: [
        { id: "v5-s", product_id: "p5", size: "S", stock_quantity: 4, is_available: true },
        { id: "v5-m", product_id: "p5", size: "M", stock_quantity: 6, is_available: true },
      ],
    },
  ],
  "pret": [
    {
      id: "p2",
      name: "Ivory Drape Dress",
      slug: "ivory-drape-dress",
      description: "A flowing ivory white maxi dress with intricate hand-embroidered details and keyhole necklines.",
      price: 32000,
      compare_at_price: null,
      sku: "AYR-IVO-02",
      category_id: "pret",
      is_active: true,
      is_featured: true,
      fabric: "Georgette Chiffon",
      color: "Ivory White",
      includes: "Maxi Dress, Slip",
      care_instructions: "Dry clean only",
      meta_title: null,
      meta_description: null,
      created_at: new Date().toISOString(),
      images: [
        {
          id: "img2",
          product_id: "p2",
          url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80",
          alt_text: "Ivory Drape Dress",
          sort_order: 1,
          is_primary: true,
        },
      ],
      variants: [
        { id: "v2-s", product_id: "p2", size: "S", stock_quantity: 6, is_available: true },
        { id: "v2-m", product_id: "p2", size: "M", stock_quantity: 8, is_available: true },
      ],
    },
  ],
};

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

const getCategory = cache(async (slug: string) => {
  try {
    const supabase = await createClient();
    
    // Look up by slug first
    const { data: categoryData, error } = await supabase
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .single();

    if (categoryData && !error) {
      return categoryData;
    }

    // Fallback: If requesting 'luxury-pret', resolve using 'pret' category from DB
    if (slug === "luxury-pret") {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", "pret")
        .single();

      if (fallbackData && !fallbackError) {
        return fallbackData;
      }
    }
  } catch (err) {
    console.error("Error loading category from Supabase:", err);
  }
  return null;
});

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);

  const name = category?.name || CATEGORY_NAMES[slug] || "Collection";
  const desc = category?.description || `Explore our premium range of ${name.toLowerCase()} couture and prêt-à-porter at Ayraa.`;

  return {
    title: name,
    description: desc,
    alternates: {
      canonical: `/collections/${slug}`,
    },
    openGraph: {
      title: `${name} | Ayraa Collection`,
      description: desc,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} | Ayraa Collection`,
      description: desc,
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategory(slug);
  const categoryName = category?.name || CATEGORY_NAMES[slug] || "Collection";

  let products: Product[] = [];

  try {
    const supabase = await createClient();

    if (category) {
      const { data: productsData } = await supabase
        .from("products")
        .select("*, category:categories(*), images:product_images(*), variants:product_variants(*)")
        .eq("category_id", category.id)
        .eq("is_active", true);

      if (productsData && productsData.length > 0) {
        products = productsData as Product[];
      }
    }

    // Fallback if DB query returned empty list
    if (products.length === 0) {
      products = MOCK_PRODUCTS[slug] || MOCK_PRODUCTS["ready-to-wear"];
    }
  } catch (err) {
    console.error("Error loading category page:", err);
    products = MOCK_PRODUCTS[slug] || MOCK_PRODUCTS["ready-to-wear"];
  }

  // If even fallbacks don't exist for the slug, render 404
  if (!products || products.length === 0) {
    notFound();
  }

  const baseUrl = "https://ayraacollection.vercel.app";
  const breadcrumbItems = [
    { name: "Home", item: "/" },
    { name: "Collections", item: "/collections" },
    { name: categoryName, item: `/collections/${slug}` },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-bg transition-colors duration-500 ease-out">
      <BreadcrumbJsonLd items={breadcrumbItems} baseUrl={baseUrl} />
      <Header />
      <main className="grow">
        <CollectionClient
          initialProducts={products}
          categoryName={categoryName}
          categorySlug={slug}
        />
      </main>
      <Footer />
    </div>
  );
}

