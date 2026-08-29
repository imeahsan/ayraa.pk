"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FinancialOverviewStats, Expense } from "@/types";
import { Button } from "@/components/storefront/Button/Button";
import { PrintablePnLModal } from "./components/PrintablePnLModal";
import styles from "./finance.module.css";

interface FinanceNavHeaderProps {
  stats?: FinancialOverviewStats | null;
  expenses?: Expense[];
  preset?: string;
  onPresetChange?: (preset: string) => void;
}

const TABS = [
  { href: "/admin/finance", label: "Overview & P&L", icon: "📊" },
  { href: "/admin/finance/expenses", label: "Expense Ledger", icon: "💳" },
  { href: "/admin/finance/inventory", label: "Inventory Valuation", icon: "📦" },
  { href: "/admin/finance/couriers", label: "Courier COD Remittances", icon: "🚚" },
  { href: "/admin/finance/unit-economics", label: "SKU Unit Economics", icon: "🎯" },
  { href: "/admin/finance/treasury", label: "Treasury & Wallets", icon: "🏦" },
];

export const FinanceNavHeader: React.FC<FinanceNavHeaderProps> = ({
  stats,
  expenses = [],
  preset = "mtd",
  onPresetChange,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPnlModal, setShowPnlModal] = useState(false);

  const currentPreset = searchParams.get("preset") || preset;

  const handlePresetSelect = (newPreset: string) => {
    if (onPresetChange) {
      onPresetChange(newPreset);
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.set("preset", newPreset);
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      {/* Top Header */}
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <h1>Enterprise Finance &amp; Intelligence</h1>
          <p>
            Real-time P&amp;L, expense lifecycle, inventory asset valuation, courier remittances, and unit economics.
          </p>
        </div>

        <div className={styles.headerControls}>
          <select
            value={currentPreset}
            onChange={(e) => handlePresetSelect(e.target.value)}
            className={styles.presetSelect}
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last_7_days">Last 7 Days</option>
            <option value="mtd">This Month (MTD)</option>
            <option value="last_month">Last Month</option>
            <option value="qtd">Quarter to Date (QTD)</option>
            <option value="ytd">Year to Date (YTD)</option>
            <option value="all">All Time</option>
          </select>

          {stats && (
            <Button
              type="button"
              variant="luxury"
              size="md"
              onClick={() => setShowPnlModal(true)}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <span>📄</span> Executive P&amp;L / Export
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Navigation Links */}
      <div className={styles.tabsNav}>
        {TABS.map((tab) => {
          const isActive =
            tab.href === "/admin/finance"
              ? pathname === "/admin/finance"
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);

          const tabUrl = currentPreset !== "mtd" ? `${tab.href}?preset=${currentPreset}` : tab.href;

          return (
            <Link
              key={tab.href}
              href={tabUrl}
              className={`${styles.tabBtn} ${isActive ? styles.tabBtnActive : ""}`}
            >
              <span>{tab.icon}</span> {tab.label}
            </Link>
          );
        })}
      </div>

      {/* PRINTABLE P&L / CSV MODAL */}
      {showPnlModal && stats && (
        <PrintablePnLModal
          stats={stats}
          expenses={expenses}
          onClose={() => setShowPnlModal(false)}
        />
      )}
    </div>
  );
};
