"use client";

import React, { useState } from "react";
import { FinancialOverviewStats, UnitEconomicsItem } from "@/types";
import { getUnitEconomicsReport } from "@/app/actions/finance";
import { FinanceNavHeader } from "../FinanceNavHeader";
import { UnitEconomicsView } from "../components/UnitEconomicsView";
import styles from "../finance.module.css";

interface UnitEconomicsClientProps {
  initialItems: UnitEconomicsItem[];
  stats?: FinancialOverviewStats | null;
  preset?: string;
}

export const UnitEconomicsClient: React.FC<UnitEconomicsClientProps> = ({
  initialItems,
  stats,
  preset = "mtd",
}) => {
  const [items, setItems] = useState<UnitEconomicsItem[]>(initialItems);

  const handleRefresh = async () => {
    const res = await getUnitEconomicsReport();
    if (res.success) {
      setItems(res.items);
    }
  };

  return (
    <div className={styles.financeContainer}>
      <FinanceNavHeader stats={stats} preset={preset} />
      <UnitEconomicsView items={items} onRefresh={handleRefresh} />
    </div>
  );
};
