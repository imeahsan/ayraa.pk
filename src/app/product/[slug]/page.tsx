import React, { cache } from "react";
import { Metadata } from "next";
import { createCacheClient } from "@/lib/supabase/cache-client";
import { Product } from "@/types";
import { Header } from "@/components/storefront/Header/Header";
import { Footer } from "@/components/storefront/Footer/Footer";
import { ProductDetailClient } from "./ProductDetailClient";
import { ProductJsonLd } from "@/components/seo/ProductJsonLd";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { notFound } from "next/navigation";


export const dynamic = "force-dynamic";

// Fallback Mock products
const MOCK_PRODUCTS: Product[] = [
  {
    id: "f1111111-1111-1111-1111-111111111111",
    name: "Noir Silk Blouse",
    slug: "noir-silk-blouse",
    description: "A sleek black ready-to-wear blouse crafted from premium raw silk, featuring structured tailoring.",
    price: 18500,
    compare_at_price: 22000,
    sku: "AYR-NOI-01",
    category_id: "cat-pret",
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
        product_id: "f1111111-1111-1111-1111-111111111111",
        url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80",
        alt_text: "Noir Silk Blouse",
        sort_order: 1,
        is_primary: true,
      },
    ],
    variants: [
      { id: "v1-xs", product_id: "f1111111-1111-1111-1111-111111111111", size: "XS", stock_quantity: 4, is_available: true },
      { id: "v1-s", product_id: "f1111111-1111-1111-1111-111111111111", size: "S", stock_quantity: 12, is_available: true },
      { id: "v1-m", product_id: "f1111111-1111-1111-1111-111111111111", size: "M", stock_quantity: 15, is_available: true },
      { id: "v1-l", product_id: "f1111111-1111-1111-1111-111111111111", size: "L", stock_quantity: 8, is_available: true },
    ],
  },
  {
    id: "f2222222-2222-2222-2222-222222222222",
    name: "Ivory Drape Dress",
    slug: "ivory-drape-dress",
    description: "A flowing ivory white maxi dress with intricate hand-embroidered details and keyhole necklines.",
    price: 32000,
    compare_at_price: null,
    sku: "AYR-IVO-02",
    category_id: "cat-luxury-pret",
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
        product_id: "f2222222-2222-2222-2222-222222222222",
        url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80",
        alt_text: "Ivory Drape Dress",
        sort_order: 1,
        is_primary: true,
      },
    ],
    variants: [
      { id: "v2-s", product_id: "f2222222-2222-2222-2222-222222222222", size: "S", stock_quantity: 6, is_available: true },
      { id: "v2-m", product_id: "f2222222-2222-2222-2222-222222222222", size: "M", stock_quantity: 8, is_available: true },
      { id: "v2-l", product_id: "f2222222-2222-2222-2222-222222222222", size: "L", stock_quantity: 0, is_available: false },
    ],
  },
  {
    id: "f3333333-3333-3333-3333-333333333333",
    name: "Olive Linen Set",
    slug: "olive-linen-set",
    description: "A modern relaxed-fit linen two-piece set in a rich olive tone with buttoned cuffs.",
    price: 21000,
    compare_at_price: 25000,
    sku: "AYR-OLI-03",
    category_id: "cat-pret",
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
        product_id: "f3333333-3333-3333-3333-333333333333",
        url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80",
        alt_text: "Olive Linen Set",
        sort_order: 1,
        is_primary: true,
      },
    ],
    variants: [
      { id: "v3-s", product_id: "f3333333-3333-3333-3333-333333333333", size: "S", stock_quantity: 10, is_available: true },
      { id: "v3-m", product_id: "f3333333-3333-3333-3333-333333333333", size: "M", stock_quantity: 12, is_available: true },
      { id: "v3-l", product_id: "f3333333-3333-3333-3333-333333333333", size: "L", stock_quantity: 10, is_available: true },
    ],
  },
  {
    id: "f4444444-4444-4444-4444-444444444444",
    name: "Terra Geometric Tunic",
    slug: "terra-geometric-tunic",
    description: "A lightweight summer lawn tunic featuring abstract geo prints in warm terracotta tones.",
    price: 9500,
    compare_at_price: null,
    sku: "AYR-TER-04",
    category_id: "cat-lawn",
    is_active: true,
    is_featured: true,
    fabric: "Lawn Cotton",
    color: "Terracotta",
    includes: "Tunic Only",
    care_instructions: "Gentle machine wash",
    meta_title: null,
    meta_description: null,
    created_at: new Date().toISOString(),
    images: [
      {
        id: "img4",
        product_id: "f4444444-4444-4444-4444-444444444444",
        url: "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=600&auto=format&fit=crop&q=80",
        alt_text: "Terra Geometric Tunic",
        sort_order: 1,
        is_primary: true,
      },
    ],
    variants: [
      { id: "v4-xs", product_id: "f4444444-4444-4444-4444-444444444444", size: "XS", stock_quantity: 2, is_available: true },
      { id: "v4-s", product_id: "f4444444-4444-4444-4444-444444444444", size: "S", stock_quantity: 5, is_available: true },
      { id: "v4-m", product_id: "f4444444-4444-4444-4444-444444444444", size: "M", stock_quantity: 12, is_available: true },
      { id: "v4-l", product_id: "f4444444-4444-4444-4444-444444444444", size: "L", stock_quantity: 4, is_available: true },
    ],
  },
  {
    id: "f5555555-5555-5555-5555-555555555555",
    name: "Midnight Chiffon Suit",
    slug: "midnight-chiffon-suit",
    description: "Exude effortless elegance in this hand-embellished midnight chiffon suit. Featuring intricate detailing and a flowing silhouette.",
    price: 85000,
    compare_at_price: 95000,
    sku: "AYR-MCF-05",
    category_id: "cat-luxury-formal",
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
        product_id: "f5555555-5555-5555-5555-555555555555",
        url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80",
        alt_text: "Midnight Chiffon Suit",
        sort_order: 1,
        is_primary: true,
      },
    ],
    variants: [
      { id: "v5-s", product_id: "f5555555-5555-5555-5555-555555555555", size: "S", stock_quantity: 4, is_available: true },
      { id: "v5-m", product_id: "f5555555-5555-5555-5555-555555555555", size: "M", stock_quantity: 6, is_available: true },
      { id: "v5-l", product_id: "f5555555-5555-5555-5555-555555555555", size: "L", stock_quantity: 2, is_available: true },
    ],
  },
];

import { unstable_cache } from "next/cache";

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

const getCachedProduct = unstable_cache(
  async (slug: string): Promise<Product | null> => {
    try {
      const supabase = createCacheClient();
      const { data, error } = await supabase
        .from("products")
        .select("*, category:categories(*), images:product_images(*)")
        .eq("slug", slug)
        .single();

      if (data && !error) {
        return {
          ...data,
          variants: []
        } as Product;
      }
    } catch (err) {
      console.error("Error loading product detail from Supabase:", err);
    }
    return MOCK_PRODUCTS.find((p) => p.slug === slug) || null;
  },
  ["product-by-slug"],
  { revalidate: 300 }
);

const getCachedRelatedProducts = unstable_cache(
  async (categoryId: string, productId: string) => {
    const supabase = createCacheClient();
    const { data: related } = await supabase
      .from("products")
      .select("*, category:categories(*), images:product_images(*), variants:product_variants!inner(*)")
      .eq("category_id", categoryId)
      .neq("id", productId)
      .eq("is_active", true)
      .gt("variants.stock_quantity", 0)
      .limit(4);
    return related || [];
  },
  ["related-products-by-category"],
  { revalidate: 300 }
);

const getCachedProductQuestions = unstable_cache(
  async (productId: string) => {
    const supabase = createCacheClient();
    const { data: qData } = await supabase
      .from("product_questions")
      .select("*")
      .eq("product_id", productId)
      .eq("is_answered", true)
      .order("created_at", { ascending: false });
    return qData || [];
  },
  ["product-questions-by-id"],
  { revalidate: 300 }
);

const getCachedProductReviews = unstable_cache(
  async (productId: string) => {
    const supabase = createCacheClient();
    const { data: rData } = await supabase
      .from("product_reviews")
      .select("*")
      .eq("product_id", productId)
      .eq("is_approved", true)
      .order("created_at", { ascending: false });
    return rData || [];
  },
  ["product-reviews-by-id"],
  { revalidate: 300 }
);

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCachedProduct(slug);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  const title = product.meta_title || `${product.name} | Premium Eastern Luxury Wear`;
  const description = product.meta_description || product.description || "";
  const primaryImage = product.images?.find((img) => img.is_primary)?.url || product.images?.[0]?.url || "";

  return {
    title,
    description,
    alternates: {
      canonical: `/product/${slug}`,
    },
    openGraph: {
      title,
      description,
      images: primaryImage ? [{ url: primaryImage, alt: product.name }] : [],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: primaryImage ? [primaryImage] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  let product = await getCachedProduct(slug);

  if (!product) {
    notFound();
  }

  // Load real-time variants to ensure accurate stock quantities
  try {
    const supabase = createCacheClient();
    const { data: realTimeVariants } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", product.id);

    if (realTimeVariants) {
      product = {
        ...product,
        variants: realTimeVariants,
      };
    }
  } catch (err) {
    console.error("Error loading real-time variants:", err);
  }

  let relatedProducts: Product[] = [];
  try {
    if (product.category_id) {
      const related = await getCachedRelatedProducts(product.category_id, product.id);
      if (related && related.length > 0) {
        relatedProducts = related as Product[];
      }
    }
  } catch (err) {
    console.error("Error loading related products from Supabase:", err);
  }

  if (relatedProducts.length === 0) {
    relatedProducts = MOCK_PRODUCTS.filter((p) => p.slug !== slug).slice(0, 4);
  }

  const baseUrl = "https://ayraacollection.vercel.app";
  const breadcrumbItems = [
    { name: "Home", item: "/" },
    { name: "Collections", item: "/collections" },
  ];

  if (product.category) {
    breadcrumbItems.push({
      name: product.category.name,
      item: `/collections/${product.category.slug}`,
    });
  }

  breadcrumbItems.push({
    name: product.name,
    item: `/product/${product.slug}`,
  });

  let questions: any[] = [];
  try {
    const qData = await getCachedProductQuestions(product.id);
    if (qData) {
      questions = qData;
    }
  } catch (err) {
    console.error("Error loading product QA:", err);
  }

  let reviews: any[] = [];
  try {
    const rData = await getCachedProductReviews(product.id);
    if (rData) {
      reviews = rData;
    }
  } catch (err) {
    console.error("Error loading product reviews:", err);
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg transition-colors duration-500 ease-out">
      <ProductJsonLd product={product} baseUrl={baseUrl} />
      <BreadcrumbJsonLd items={breadcrumbItems} baseUrl={baseUrl} />
      <Header />
      <main className="grow">
        <ProductDetailClient
          product={product}
          relatedProducts={relatedProducts}
          initialQuestions={questions}
          initialReviews={reviews}
        />
      </main>
      <Footer />
    </div>
  );
}

