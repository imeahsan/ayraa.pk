import React, { cache } from "react";
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
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
    id: "p1",
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
        product_id: "p1",
        url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80",
        alt_text: "Noir Silk Blouse",
        sort_order: 1,
        is_primary: true,
      },
    ],
    variants: [
      { id: "v1-xs", product_id: "p1", size: "XS", stock_quantity: 4, is_available: true },
      { id: "v1-s", product_id: "p1", size: "S", stock_quantity: 12, is_available: true },
      { id: "v1-m", product_id: "p1", size: "M", stock_quantity: 15, is_available: true },
      { id: "v1-l", product_id: "p1", size: "L", stock_quantity: 8, is_available: true },
    ],
  },
  {
    id: "p2",
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
      { id: "v2-l", product_id: "p2", size: "L", stock_quantity: 0, is_available: false },
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
      { id: "v3-l", product_id: "p3", size: "L", stock_quantity: 10, is_available: true },
    ],
  },
  {
    id: "p4",
    name: "Terra Geometric Tunic",
    slug: "terra-geometric-tunic",
    description: "A lightweight lawn tunic featuring abstract geo prints in warm terracotta tones.",
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
        product_id: "p4",
        url: "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=600&auto=format&fit=crop&q=80",
        alt_text: "Terra Geometric Tunic",
        sort_order: 1,
        is_primary: true,
      },
    ],
    variants: [
      { id: "v4-xs", product_id: "p4", size: "XS", stock_quantity: 2, is_available: true },
      { id: "v4-s", product_id: "p4", size: "S", stock_quantity: 5, is_available: true },
      { id: "v4-m", product_id: "p4", size: "M", stock_quantity: 12, is_available: true },
      { id: "v4-l", product_id: "p4", size: "L", stock_quantity: 4, is_available: true },
    ],
  },
  {
    id: "p5",
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
      { id: "v5-l", product_id: "p5", size: "L", stock_quantity: 2, is_available: true },
    ],
  },
];

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

const getProduct = cache(async (slug: string): Promise<Product | null> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, category:categories(*), images:product_images(*), variants:product_variants(*)")
      .eq("slug", slug)
      .single();

    if (data && !error) {
      return data as Product;
    }
  } catch (err) {
    console.error("Error loading product detail from Supabase:", err);
  }
  return MOCK_PRODUCTS.find((p) => p.slug === slug) || null;
});

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

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
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  let relatedProducts: Product[] = [];
  try {
    const supabase = await createClient();
    // Query related products in same category
    const { data: related } = await supabase
      .from("products")
      .select("*, category:categories(*), images:product_images(*)")
      .eq("category_id", product.category_id)
      .neq("id", product.id)
      .eq("is_active", true)
      .limit(4);

    if (related) {
      relatedProducts = related as Product[];
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

  return (
    <div className="flex flex-col min-h-screen bg-bg transition-colors duration-500 ease-out">
      <ProductJsonLd product={product} baseUrl={baseUrl} />
      <BreadcrumbJsonLd items={breadcrumbItems} baseUrl={baseUrl} />
      <Header />
      <main className="grow">
        <ProductDetailClient product={product} relatedProducts={relatedProducts} />
      </main>
      <Footer />
    </div>
  );
}

