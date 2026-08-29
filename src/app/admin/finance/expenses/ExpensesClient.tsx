"use client";

import React, { useState } from "react";
import { Expense, FinancialOverviewStats } from "@/types";
import { getExpensesList } from "@/app/actions/finance";
import { FinanceNavHeader } from "../FinanceNavHeader";
import { ExpenseManager } from "../components/ExpenseManager";
import styles from "../finance.module.css";

interface ExpensesClientProps {
  initialExpenses: Expense[];
  stats?: FinancialOverviewStats | null;
  preset?: string;
}

export const ExpensesClient: React.FC<ExpensesClientProps> = ({
  initialExpenses,
  stats,
  preset = "mtd",
}) => {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);

  const handleRefresh = async () => {
    const res = await getExpensesList();
    if (res.success) {
      setExpenses(res.data);
    }
  };

  return (
    <div className={styles.financeContainer}>
      <FinanceNavHeader stats={stats} expenses={expenses} preset={preset} />
      <ExpenseManager expenses={expenses} onRefresh={handleRefresh} />
    </div>
  );
};
