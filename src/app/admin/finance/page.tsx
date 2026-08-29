import React from "react";
import { Metadata } from "next";
import { getExpensesList, getFinancialOverview } from "@/app/actions/finance";
import { FinanceNavHeader } from "./FinanceNavHeader";
import { FinanceKpiGrid } from "./components/FinanceKpiGrid";
import { FinancialCharts } from "./components/FinancialCharts";
import { ExpenseManager } from "./components/ExpenseManager";
import styles from "./finance.module.css";

export const metadata: Metadata = {
  title: "Enterprise Finance & P&L | Ayra Admin",
  description: "Executive financial intelligence, profit & loss, expense management, inventory valuation, and courier remittances.",
};

export const dynamic = "force-dynamic";

export default async function AdminFinanceOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const preset = (params.preset as any) || "mtd";

  const [overviewRes, expensesRes] = await Promise.all([
    getFinancialOverview({ preset, from: params.from, to: params.to }),
    getExpensesList({ from: params.from, to: params.to }),
  ]);

  const stats = overviewRes.data || null;
  const expenses = expensesRes.data || [];

  return (
    <div className={styles.financeContainer}>
      <FinanceNavHeader stats={stats} expenses={expenses} preset={preset} />

      {!stats ? (
        <p className="font-body text-sm text-error text-center py-16">
          Failed to load financial overview.
        </p>
      ) : (
        <div>
          <FinanceKpiGrid stats={stats} />
          <FinancialCharts stats={stats} expenses={expenses} />
        </div>
      )}
    </div>
  );
}
