import React from "react";
import { Metadata } from "next";
import ContactClient from "./ContactClient";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Ayraa's flagship studio in Karachi. Contact us for custom couture orders, sizing assistance, and support.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Us | Ayraa Collection",
    description: "Get in touch with Ayraa's customer care team.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us | Ayraa Collection",
    description: "Get in touch with Ayraa's customer care team.",
  },
};

export default function ContactPage() {
  const baseUrl = "https://ayraacollection.vercel.app";
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
