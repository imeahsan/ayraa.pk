import React from "react";
import { Metadata } from "next";
import { ComingSoonClient } from "./ComingSoonClient";

export const metadata: Metadata = {
  title: "Coming Soon | Summer Lawn & Bed Sheets Collection | Ayraa Collection",
  description: "Our premium Pakistani Summer Lawn suitings, soft-finished luxury bed sheets, and handcrafted home textiles are launching soon. Preview and pre-book via WhatsApp.",
  openGraph: {
    title: "Summer Lawn & Bed Sheets | Coming Soon | Ayraa Collection",
    description: "Scheduled launch in progress. Pre-book your Pakistani Summer Lawn and Luxury Bed Sheets via WhatsApp.",
  },
};

export default function ComingSoonPage() {
  return <ComingSoonClient />;
}
