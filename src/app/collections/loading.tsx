import React from "react";
import { Header } from "@/components/storefront/Header/Header";
import { Footer } from "@/components/storefront/Footer/Footer";
import { LuxuryLoader } from "@/components/common/LuxuryLoader";
import { ProductCardSkeleton } from "@/components/common/ProductCardSkeleton";

export default function CollectionsLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-bg">
      <Header />

      <main className="grow pt-20 md:pt-16">
        <div style={{ maxWidth: "1400px", marginInline: "auto", paddingInline: "24px", paddingTop: "32px", paddingBottom: "80px" }}>
          <div style={{ marginBottom: "32px" }}>
            <LuxuryLoader label="Loading All Collections..." size="md" variant="inline" />
          </div>
          <ProductCardSkeleton count={8} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
