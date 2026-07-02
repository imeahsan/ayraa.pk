import React from "react";
import { DEFAULT_SEO_DESCRIPTION, SITE_NAME } from "@/lib/seo";

interface WebSiteJsonLdProps {
  baseUrl: string;
}

export function WebSiteJsonLd({ baseUrl }: WebSiteJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    "name": SITE_NAME,
    "url": baseUrl,
    "description": DEFAULT_SEO_DESCRIPTION,
    "inLanguage": "en-PK",
    "publisher": {
      "@id": `${baseUrl}/#organization`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
