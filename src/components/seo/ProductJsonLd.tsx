import React from "react";
import { Product } from "@/types";
import { SITE_NAME } from "@/lib/seo";

interface ProductJsonLdProps {
  product: Product;
  baseUrl: string;
}

export function ProductJsonLd({ product, baseUrl }: ProductJsonLdProps) {
  const primaryImage = product.images?.find((img) => img.is_primary)?.url || product.images?.[0]?.url;
  const productUrl = `${baseUrl}/product/${product.slug}`;
  const imageUrls = product.images?.map((img) => absoluteImageUrl(img.url, baseUrl)) || [];

  const offers = product.variants?.map((v) => ({
    "@type": "Offer",
    "sku": `${product.sku || product.id}-${v.size}`,
    "price": Number(product.price),
    "priceCurrency": "PKR",
    "itemCondition": "https://schema.org/NewCondition",
    "availability": v.is_available && v.stock_quantity > 0 
      ? "https://schema.org/InStock" 
      : "https://schema.org/OutOfStock",
    "url": productUrl,
    "seller": {
      "@id": `${baseUrl}/#organization`,
    },
  })) || [
    {
      "@type": "Offer",
      "sku": product.sku || product.id,
      "price": Number(product.price),
      "priceCurrency": "PKR",
      "itemCondition": "https://schema.org/NewCondition",
      "availability": "https://schema.org/InStock",
      "url": productUrl,
      "seller": {
        "@id": `${baseUrl}/#organization`,
      },
    }
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}#product`,
    "name": product.name,
    "url": productUrl,
    "image": imageUrls.length > 0 ? imageUrls : (primaryImage ? [absoluteImageUrl(primaryImage, baseUrl)] : []),
    "description": product.description || "",
    "sku": product.sku || product.id,
    "category": product.category?.name,
    "brand": {
      "@type": "Brand",
      "name": SITE_NAME,
    },
    "offers": offers.length === 1 ? offers[0] : offers,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

function absoluteImageUrl(url: string, baseUrl: string) {
  if (/^https?:\/\//i.test(url)) return url;
  return `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`;
}
