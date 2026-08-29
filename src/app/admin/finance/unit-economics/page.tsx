import React from "react";
import { Metadata } from "next";
import { getFinancialOverview, getUnitEconomicsReport } from "@/app/actions/finance";
import { UnitEconomicsClient } from "./UnitEconomicsClient";

export const metadata: Metadata = {
  title: "SKU Unit Economics & Contribution Margins | Ayra Finance",
  description: "Product-level CM1 and CM2 profitability, profit heroes, and margin erosion analysis.",
};

export const dynamic = "force-dynamic";

export default async function FinanceUnitEconomicsPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const preset = (params.preset as any) || "mtd";

  const [unitEcoRes, overviewRes] = await Promise.all([
    getUnitEconomicsReport(),
    getFinancialOverview({ preset, from: params.from, to: params.to }),
  ]);

  return (
    <UnitEconomicsClient
      initialItems={unitEcoRes.items || []}
      stats={overviewRes.data || null}
      preset={preset}
    />
  );
}
