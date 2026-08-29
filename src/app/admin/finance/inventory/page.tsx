import React from "react";
import { Metadata } from "next";
import { getFinancialOverview, getInventoryValuationAndAging } from "@/app/actions/finance";
import { InventoryClient } from "./InventoryClient";

export const metadata: Metadata = {
  title: "Inventory Valuation & Capital Aging | Ayra Finance",
  description: "Real-time warehouse stock holding value, retail turnover potential, and capital velocity aging.",
};

export const dynamic = "force-dynamic";

export default async function FinanceInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const preset = (params.preset as any) || "mtd";

  const [inventoryRes, overviewRes] = await Promise.all([
    getInventoryValuationAndAging(),
    getFinancialOverview({ preset, from: params.from, to: params.to }),
  ]);

  return (
    <InventoryClient
      initialItems={inventoryRes.items || []}
      initialSummary={{
        totalHoldingCost: inventoryRes.totalHoldingCost || 0,
        totalRetailValue: inventoryRes.totalRetailValue || 0,
        totalStockUnits: inventoryRes.totalStockUnits || 0,
        agingSummary: inventoryRes.agingSummary || { fresh: 0, mature: 0, dead: 0 },
      }}
      stats={overviewRes.data || null}
      preset={preset}
    />
  );
}
