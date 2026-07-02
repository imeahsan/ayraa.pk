import React from "react";

interface ItemListJsonLdItem {
  name: string;
  url: string;
}

interface ItemListJsonLdProps {
  items: ItemListJsonLdItem[];
  name: string;
  baseUrl: string;
}

export function ItemListJsonLd({ items, name, baseUrl }: ItemListJsonLdProps) {
  if (items.length === 0) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": name,
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "url": item.url.startsWith("http") ? item.url : `${baseUrl}${item.url}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
