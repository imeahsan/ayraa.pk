import React from "react";
import { Metadata } from "next";
import { getExpensesList, getFinancialOverview } from "@/app/actions/finance";
import { ExpensesClient } from "./ExpensesClient";

export const metadata: Metadata = {
  title: "Operating Expense Ledger | Ayra Finance",
  description: "Manage, track, and categorize store operating expenses, marketing spend, and recurring overheads.",
};

export const dynamic = "force-dynamic";

export default async function FinanceExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const preset = (params.preset as any) || "mtd";

  const [expensesRes, overviewRes] = await Promise.all([
    getExpensesList({ from: params.from, to: params.to }),
    getFinancialOverview({ preset, from: params.from, to: params.to }),
  ]);

  return (
    <ExpensesClient
      initialExpenses={expensesRes.data || []}
      stats={overviewRes.data || null}
      preset={preset}
    />
  );
}
