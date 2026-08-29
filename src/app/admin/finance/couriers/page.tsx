import React from "react";
import { Metadata } from "next";
import { getCourierRemittanceReconciliation, getFinancialOverview } from "@/app/actions/finance";
import { FinanceNavHeader } from "../FinanceNavHeader";
import { CourierReconciliationView } from "../components/CourierReconciliationView";
import styles from "../finance.module.css";

export const metadata: Metadata = {
  title: "Courier COD Remittance Reconciliation | Ayra Finance",
  description: "Track cash collected by couriers vs bank deposits, service fee deductions, and RTO dead shipping losses.",
};

export const dynamic = "force-dynamic";

export default async function FinanceCouriersPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const preset = (params.preset as any) || "mtd";

  const [couriersRes, overviewRes] = await Promise.all([
    getCourierRemittanceReconciliation(),
    getFinancialOverview({ preset, from: params.from, to: params.to }),
  ]);

  const couriers = couriersRes.couriers || [];
  const stats = overviewRes.data || null;

  return (
    <div className={styles.financeContainer}>
      <FinanceNavHeader stats={stats} preset={preset} />
      <CourierReconciliationView
        couriers={couriers}
        totalExpectedCod={couriersRes.totalExpectedCod || 0}
        totalNetRemittable={couriersRes.totalNetRemittable || 0}
        totalRtoLoss={couriersRes.totalRtoLoss || 0}
      />
    </div>
  );
}
