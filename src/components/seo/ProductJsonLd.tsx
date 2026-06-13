import React from "react";
import { Product } from "@/types";

interface ProductJsonLdProps {
  product: Product;
  baseUrl: string;
}

export function ProductJsonLd({ product, baseUrl }: ProductJsonLdProps) {
  const primaryImage = product.images?.find((img) => img.is_primary)?.url || product.images?.[0]?.url;
  const imageUrls = product.images?.map((img) => img.url) || [];

  const offers = product.variants?.map((v) => ({
    "@type": "Offer",
    "sku": `${product.sku || product.id}-${v.size}`,
    "price": product.price,
    "priceCurrency": "PKR",
    "itemCondition": "https://schema.org/NewCondition",
    "availability": v.is_available && v.stock_quantity > 0 
      ? "https://schema.org/InStock" 
      : "https://schema.org/OutOfStock",
    "url": `${baseUrl}/product/${product.slug}`,
  })) || [
    {
      "@type": "Offer",
      "sku": product.sku || product.id,
      "price": product.price,
      "priceCurrency": "PKR",
      "itemCondition": "https://schema.org/NewCondition",
      "availability": "https://schema.org/InStock",
      "url": `${baseUrl}/product/${product.slug}`,
    }
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": imageUrls.length > 0 ? imageUrls : (primaryImage ? [primaryImage] : []),
    "description": product.description || "",
    "sku": product.sku || product.id,
    "brand": {
      "@type": "Brand",
      "name": "Ayraa"
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
