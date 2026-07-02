import React from "react";
import { Metadata } from "next";
import ContactClient from "./ContactClient";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";

export const metadata: Metadata = {
  title: "Contact Us | Ayraa Collection",
  description:
    "Contact Ayraa for order support, sizing help, delivery updates, and general customer care across Pakistan.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Us | Ayraa Collection",
    description: "Contact Ayraa for order support, sizing help, delivery updates, and customer care.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us | Ayraa Collection",
    description: "Contact Ayraa for order support, sizing help, delivery updates, and customer care.",
  },
};

export default function ContactPage() {
  const baseUrl = "https://store.ayraa.pk";
  const breadcrumbItems = [
    { name: "Home", item: "/" },
    { name: "Contact", item: "/contact" },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbItems} baseUrl={baseUrl} />
      <ContactClient />
    </>
  );
}
