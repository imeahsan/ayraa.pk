import React from "react";
import { DEFAULT_SEO_DESCRIPTION, SITE_NAME } from "@/lib/seo";

interface OrganizationJsonLdProps {
  baseUrl: string;
}

export function OrganizationJsonLd({ baseUrl }: OrganizationJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    "@id": `${baseUrl}/#organization`,
    "name": SITE_NAME,
    "alternateName": "Ayraa",
    "url": baseUrl,
    "logo": `${baseUrl}/favicon.png`,
    "image": `${baseUrl}/og-image.jpg`,
    "description": DEFAULT_SEO_DESCRIPTION,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Karachi",
      "addressRegion": "Sindh",
      "addressCountry": "PK",
    },
    "areaServed": "PK",
    "currenciesAccepted": "PKR",
    "paymentAccepted": ["Cash on Delivery"],
    "priceRange": "PKR",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
