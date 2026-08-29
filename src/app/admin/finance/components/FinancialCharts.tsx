"use client";

import React from "react";
import { Expense, FinancialOverviewStats } from "@/types";
import styles from "../finance.module.css";

interface FinancialChartsProps {
  stats: FinancialOverviewStats;
  expenses: Expense[];
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  marketing_ads: { label: "Marketing & Paid Ads", color: "#3b82f6" },
  fabric_materials: { label: "Fabric & Material Sourcing", color: "#eab308" },
  packaging_supplies: { label: "Packaging & Bags", color: "#ec4899" },
  salaries_wages: { label: "Salaries & Staff Wages", color: "#10b981" },
  logistics_shipping: { label: "Courier & Shipping Overages", color: "#8b5cf6" },
  rent_utilities: { label: "Boutique Rent & Utilities", color: "#f97316" },
  software_tools: { label: "Software, POS & Shopify", color: "#06b6d4" },
  office_maintenance: { label: "Repairs & Maintenance", color: "#64748b" },
  taxes_legal: { label: "Taxes & Professional Fees", color: "#a855f7" },
  miscellaneous: { label: "General & Miscellaneous", color: "#71717a" },
};

export const FinancialCharts: React.FC<FinancialChartsProps> = ({ stats, expenses }) => {
  const formatPKR = (amount: number) =>
    Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  // Group expenses by category
  const expenseByCategory = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const exp of expenses) {
      const curr = map.get(exp.category) || 0;
      map.set(exp.category, curr + Number(exp.amount || 0));
    }

    const list = Array.from(map.entries()).map(([cat, amount]) => ({
      category: cat,
      label: CATEGORY_LABELS[cat]?.label || cat,
      color: CATEGORY_LABELS[cat]?.color || "#e9c349",
      amount,
      percentage: stats.operatingExpenses > 0 ? (amount / stats.operatingExpenses) * 100 : 0,
    }));

    list.sort((a, b) => b.amount - a.amount);
    return list;
  }, [expenses, stats.operatingExpenses]);

  // Cash Inflows vs Total Outflows
  const totalOutflow = stats.cogsAmount + stats.operatingExpenses + stats.rtoShippingLoss;
  const maxBarVal = Math.max(stats.netRevenue, totalOutflow, 1);
  const revenueBarPct = Math.min(100, Math.round((stats.netRevenue / maxBarVal) * 100));
  const outflowBarPct = Math.min(100, Math.round((totalOutflow / maxBarVal) * 100));

  return (
    <div className={styles.chartsGrid}>
      {/* Chart 1: Cash Inflows vs Cash Outflows Comparison */}
      <div className={styles.waterfallCard} style={{ margin: 0 }}>
        <div className={styles.cardTitle}>Inflow vs Total Outflow Comparison</div>
        <div className={styles.cardSubtitle}>
          Realized Net Revenue vs (COGS + Operating Expenses + Shipping Losses) for {stats.period.label}.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "24px" }}>
          {/* Revenue Bar */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
              <span style={{ fontWeight: 600, color: "#4ade80" }}>🟢 Net Inflow (Sales Collected)</span>
              <strong style={{ color: "#ffffff" }}>{formatPKR(stats.netRevenue)}</strong>
            </div>
            <div style={{ width: "100%", height: "24px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "4px", overflow: "hidden" }}>
              <div
                style={{
                  width: `${revenueBarPct}%`,
                  height: "100%",
                  backgroundColor: "#22c55e",
                  borderRadius: "4px",
                  transition: "width 0.6s ease",
                }}
              />
            </div>
          </div>

          {/* Outflow Bar */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
              <span style={{ fontWeight: 600, color: "#f87171" }}>🔴 Total Outflow (COGS + OPEX + Losses)</span>
              <strong style={{ color: "#ffffff" }}>{formatPKR(totalOutflow)}</strong>
            </div>
            <div style={{ width: "100%", height: "24px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "4px", overflow: "hidden" }}>
              <div
                style={{
                  width: `${outflowBarPct}%`,
                  height: "100%",
                  backgroundColor: "#ef4444",
                  borderRadius: "4px",
                  transition: "width 0.6s ease",
                }}
              />
            </div>
          </div>

          {/* Net Balance Status */}
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: stats.netProfit >= 0 ? "rgba(74, 222, 128, 0.08)" : "rgba(239, 68, 68, 0.08)",
              border: `1px solid ${stats.netProfit >= 0 ? "rgba(74, 222, 128, 0.25)" : "rgba(239, 68, 68, 0.25)"}`,
              borderRadius: "6px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "13px",
            }}
          >
            <span>
              Net Cash Realization: <strong>{stats.netProfit >= 0 ? "SURPLUS" : "DEFICIT"}</strong>
            </span>
            <strong style={{ fontSize: "16px", color: stats.netProfit >= 0 ? "#4ade80" : "#f87171" }}>
              {stats.netProfit >= 0 ? `+${formatPKR(stats.netProfit)}` : formatPKR(stats.netProfit)}
            </strong>
          </div>
        </div>
      </div>

      {/* Chart 2: Expense Category Breakdown */}
      <div className={styles.waterfallCard} style={{ margin: 0 }}>
        <div className={styles.cardTitle}>Expense Category Distribution</div>
        <div className={styles.cardSubtitle}>
          Total Spend: {formatPKR(stats.operatingExpenses)}
        </div>

        {expenseByCategory.length === 0 ? (
          <p style={{ fontStyle: "italic", fontSize: "12px", color: "var(--admin-text-sub)", textAlign: "center", padding: "32px 0" }}>
            No expenses recorded for this time horizon.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "14px" }}>
            {expenseByCategory.slice(0, 5).map((item) => (
              <div key={item.category}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                  <span style={{ color: "var(--admin-text)", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: item.color }} />
                    {item.label}
                  </span>
                  <span style={{ color: "var(--admin-text-sub)" }}>
                    {formatPKR(item.amount)} ({item.percentage.toFixed(0)}%)
                  </span>
                </div>
                <div style={{ width: "100%", height: "6px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${item.percentage}%`,
                      height: "100%",
                      backgroundColor: item.color,
                      borderRadius: "3px",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
