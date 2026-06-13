import React from "react";

interface OrganizationJsonLdProps {
  baseUrl: string;
}

export function OrganizationJsonLd({ baseUrl }: OrganizationJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    "name": "Ayraa Collection",
    "url": baseUrl,
    "logo": `${baseUrl}/favicon.ico`,
    "description": "Exquisite Eastern couture and luxury prêt-à-porter collection for women. Indulge in premium quality fabrics, intricate craftsmanship, and timeless designs.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Karachi",
      "addressRegion": "Sindh",
      "addressCountry": "PK",
    },
    "priceRange": "PKR",
    "telephone": "+923001234567",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
