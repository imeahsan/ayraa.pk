"use client";

import React, { useState } from "react";
import { FinancialOverviewStats, InventoryAgingItem } from "@/types";
import { getInventoryValuationAndAging } from "@/app/actions/finance";
import { FinanceNavHeader } from "../FinanceNavHeader";
import { InventoryValuationView } from "../components/InventoryValuationView";
import styles from "../finance.module.css";

interface InventoryClientProps {
  initialItems: InventoryAgingItem[];
  initialSummary: {
    totalHoldingCost: number;
    totalRetailValue: number;
    totalStockUnits: number;
    agingSummary: { fresh: number; mature: number; dead: number };
  };
  stats?: FinancialOverviewStats | null;
  preset?: string;
}

export const InventoryClient: React.FC<InventoryClientProps> = ({
  initialItems,
  initialSummary,
  stats,
  preset = "mtd",
}) => {
  const [items, setItems] = useState<InventoryAgingItem[]>(initialItems);
  const [summary, setSummary] = useState(initialSummary);

  const handleRefresh = async () => {
    const res = await getInventoryValuationAndAging();
    if (res.success) {
      setItems(res.items);
      setSummary({
        totalHoldingCost: res.totalHoldingCost,
        totalRetailValue: res.totalRetailValue,
        totalStockUnits: res.totalStockUnits,
        agingSummary: res.agingSummary,
      });
    }
  };

  return (
    <div className={styles.financeContainer}>
      <FinanceNavHeader stats={stats} preset={preset} />
      <InventoryValuationView
        items={items}
        totalHoldingCost={summary.totalHoldingCost}
        totalRetailValue={summary.totalRetailValue}
        totalStockUnits={summary.totalStockUnits}
        agingSummary={summary.agingSummary}
        onRefresh={handleRefresh}
      />
    </div>
  );
};
