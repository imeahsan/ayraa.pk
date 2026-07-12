import React from "react";
import { Metadata } from "next";
import { createCacheClient } from "@/lib/supabase/cache-client";
import { Product } from "@/types";
import { Header } from "@/components/storefront/Header/Header";
import { Footer } from "@/components/storefront/Footer/Footer";
import { ProductDetailClient } from "./ProductDetailClient";
import { ProductJsonLd } from "@/components/seo/ProductJsonLd";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { notFound } from "next/navigation";
import { absoluteUrl, getSiteUrl, productSeoTitle, truncateSeoText } from "@/lib/seo";
import { unstable_cache } from "next/cache";

export const revalidate = 300;

export async function generateStaticParams() {
  return [{ slug: "single-bed-sheets-sbs-02" }];
}

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    preview?: string;
  }>;
}

const getCachedProduct = unstable_cache(
  async (slug: string): Promise<Product | null> => {
    try {
      const supabase = createCacheClient();
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
    return null;
  },
  ["product-by-slug"],
  { revalidate: 300, tags: ["products", "categories"] }
);

const getCachedRelatedProducts = unstable_cache(
  async (categoryId: string, productId: string) => {
    const supabase = createCacheClient();
    const { data: related } = await supabase
      .from("products")
      .select("*, category:categories(*), images:product_images(*), variants:product_variants(*)")
      .eq("category_id", categoryId)
      .neq("id", productId)
      .eq("is_active", true)
      .limit(4);
    return related || [];
  },
  ["related-products-by-category"],
  { revalidate: 300, tags: ["products", "categories"] }
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
  { revalidate: 300, tags: ["questions"] }
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
  { revalidate: 300, tags: ["reviews"] }
);

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCachedProduct(slug);

  if (!product) {
    return {
      title: "Product Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = product.meta_title || productSeoTitle(product.name);
  const description = truncateSeoText(
    product.meta_description || product.description,
    `Shop ${product.name} at Ayraa Collection with COD and nationwide delivery in Pakistan.`
  );
  const primaryImage = product.images?.find((img) => img.is_primary)?.url || product.images?.[0]?.url || "";
  const canonical = `/product/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(canonical),
      images: primaryImage ? [{ url: absoluteUrl(primaryImage), alt: product.name }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: primaryImage ? [absoluteUrl(primaryImage)] : [],
    },
  };
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { slug } = await params;
  const sParams = await searchParams;
  const isPreview = sParams?.preview === "true";

  let product = await getCachedProduct(slug);

  if (!product && !isPreview) {
    notFound();
  }

  if (!product && isPreview) {
    product = {
      id: "preview-id",
      name: "Preview Product",
      slug: slug,
      description: null,
      price: 0,
      compare_at_price: null,
      sku: "PREVIEW",
      category_id: null,
      is_active: true,
      is_featured: false,
      fabric: null,
      color: null,
      includes: null,
      care_instructions: null,
      meta_title: null,
      meta_description: null,
      created_at: new Date().toISOString(),
      images: [],
      variants: [],
    };
  }

  if (!product) {
    return null;
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
    relatedProducts = [];
  }

  const baseUrl = getSiteUrl();
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

