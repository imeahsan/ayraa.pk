import React from "react";
import { Metadata } from "next";
import { getFinancialOverview, getTreasuryAccounts } from "@/app/actions/finance";
import { FinanceNavHeader } from "../FinanceNavHeader";
import { TreasuryAccountsView } from "../components/TreasuryAccountsView";
import styles from "../finance.module.css";

export const metadata: Metadata = {
  title: "Multi-Account Treasury & Wallets | Ayra Finance",
  description: "Live liquidity balances across primary bank accounts, POS cash drawer, and courier wallets.",
};

export const dynamic = "force-dynamic";

export default async function FinanceTreasuryPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const preset = (params.preset as any) || "mtd";

  const [accountsRes, overviewRes] = await Promise.all([
    getTreasuryAccounts(),
    getFinancialOverview({ preset, from: params.from, to: params.to }),
  ]);

  const accounts = accountsRes.accounts || [];
  const totalCash = accountsRes.totalCashAssets || 0;
  const stats = overviewRes.data || null;

  return (
    <div className={styles.financeContainer}>
      <FinanceNavHeader stats={stats} preset={preset} />
      <TreasuryAccountsView accounts={accounts} totalCashAssets={totalCash} />
    </div>
  );
}
