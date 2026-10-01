import React from "react";
import { Header } from "@/components/storefront/Header/Header";
import { Footer } from "@/components/storefront/Footer/Footer";
import { LuxuryLoader } from "@/components/common/LuxuryLoader";

export default function ProductLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-bg">
      <Header />

      <main className="grow pt-20 md:pt-16">
        <LuxuryLoader label="Loading Piece Details..." size="lg" variant="page" />
      </main>

      <Footer />
    </div>
  );
}
