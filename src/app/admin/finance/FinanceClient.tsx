"use client";

import React, { useEffect, useState } from "react";
import {
  CourierRemittanceBreakdown,
  Expense,
  FinancialAccount,
  FinancialOverviewStats,
  InventoryAgingItem,
  UnitEconomicsItem,
} from "@/types";
import { Button } from "@/components/storefront/Button/Button";
import { useToast } from "@/context/ToastContext";
import {
  getCourierRemittanceReconciliation,
  getExpensesList,
  getFinancialOverview,
  getInventoryValuationAndAging,
  getTreasuryAccounts,
  getUnitEconomicsReport,
} from "@/app/actions/finance";
import { FinanceKpiGrid } from "./components/FinanceKpiGrid";
import { FinancialCharts } from "./components/FinancialCharts";
import { ExpenseManager } from "./components/ExpenseManager";
import { InventoryValuationView } from "./components/InventoryValuationView";
import { CourierReconciliationView } from "./components/CourierReconciliationView";
import { UnitEconomicsView } from "./components/UnitEconomicsView";
import { TreasuryAccountsView } from "./components/TreasuryAccountsView";
import { PrintablePnLModal } from "./components/PrintablePnLModal";
import styles from "./finance.module.css";

type TabKey = "overview" | "expenses" | "inventory" | "couriers" | "unit_economics" | "treasury";

export const FinanceClient: React.FC = () => {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [datePreset, setDatePreset] = useState<
    "today" | "yesterday" | "last_7_days" | "mtd" | "last_month" | "qtd" | "ytd" | "all"
  >("mtd");

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<FinancialOverviewStats | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryAgingItem[]>([]);
  const [inventorySummary, setInventorySummary] = useState({
    holdingCost: 0,
    retailValue: 0,
    totalUnits: 0,
    aging: { fresh: 0, mature: 0, dead: 0 },
  });
  const [couriers, setCouriers] = useState<CourierRemittanceBreakdown[]>([]);
  const [courierTotals, setCourierTotals] = useState({ expectedCod: 0, netRemittable: 0, rtoLoss: 0 });
  const [unitEconomics, setUnitEconomics] = useState<UnitEconomicsItem[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [totalCash, setTotalCash] = useState(0);

  const [showPnlModal, setShowPnlModal] = useState(false);

  const loadAllFinanceData = async () => {
    setLoading(true);
    try {
      const [
        overviewRes,
        expensesRes,
        inventoryRes,
        couriersRes,
        unitEcoRes,
        accountsRes,
      ] = await Promise.all([
        getFinancialOverview({ preset: datePreset }),
        getExpensesList(),
        getInventoryValuationAndAging(),
        getCourierRemittanceReconciliation(),
        getUnitEconomicsReport(),
        getTreasuryAccounts(),
      ]);

      if (overviewRes.success && overviewRes.data) {
        setStats(overviewRes.data);
      }

      if (expensesRes.success) {
        setExpenses(expensesRes.data);
      }

      if (inventoryRes.success) {
        setInventoryItems(inventoryRes.items);
        setInventorySummary({
          holdingCost: inventoryRes.totalHoldingCost,
          retailValue: inventoryRes.totalRetailValue,
          totalUnits: inventoryRes.totalStockUnits,
          aging: inventoryRes.agingSummary,
        });
      }

      if (couriersRes.success) {
        setCouriers(couriersRes.couriers);
        setCourierTotals({
          expectedCod: couriersRes.totalExpectedCod,
          netRemittable: couriersRes.totalNetRemittable,
          rtoLoss: couriersRes.totalRtoLoss,
        });
      }

      if (unitEcoRes.success) {
        setUnitEconomics(unitEcoRes.items);
      }

      if (accountsRes.success) {
        setAccounts(accountsRes.accounts);
        setTotalCash(accountsRes.totalCashAssets);
      }
    } catch (err: any) {
      // Graceful fallback without noisy errors
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllFinanceData();
  }, [datePreset]);

  return (
    <div className={styles.financeContainer}>
      {/* Header Row */}
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <h1>Enterprise Finance & Intelligence</h1>
          <p>
            Real-time P&L, expense lifecycle, inventory asset valuation, courier remittances, and unit economics.
          </p>
        </div>

        <div className={styles.headerControls}>
          <select
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value as any)}
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
              <span>📄</span> Executive P&L / Export
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={styles.tabsNav}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "overview" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <span>📊</span> Overview & P&L
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "expenses" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("expenses")}
        >
          <span>💳</span> Expense Ledger ({expenses.length})
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "inventory" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("inventory")}
        >
          <span>📦</span> Inventory Valuation & Aging
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "couriers" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("couriers")}
        >
          <span>🚚</span> Courier COD Remittances
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "unit_economics" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("unit_economics")}
        >
          <span>🎯</span> SKU Unit Economics
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "treasury" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("treasury")}
        >
          <span>🏦</span> Treasury & Wallets
        </button>
      </div>

      {/* Tab Content */}
      {loading ? (
        <p className="font-body text-sm text-admin-text-sub text-center py-16">
          Calculating financial metrics, COGS, and reconciliations...
        </p>
      ) : !stats ? (
        <p className="font-body text-sm text-error text-center py-16">Failed to load financial overview.</p>
      ) : (
        <>
          {activeTab === "overview" && (
            <div>
              <FinanceKpiGrid stats={stats} />
              <FinancialCharts stats={stats} expenses={expenses} />
              <ExpenseManager expenses={expenses} onRefresh={loadAllFinanceData} />
            </div>
          )}

          {activeTab === "expenses" && (
            <ExpenseManager expenses={expenses} onRefresh={loadAllFinanceData} />
          )}

          {activeTab === "inventory" && (
            <InventoryValuationView
              items={inventoryItems}
              totalHoldingCost={inventorySummary.holdingCost}
              totalRetailValue={inventorySummary.retailValue}
              totalStockUnits={inventorySummary.totalUnits}
              agingSummary={inventorySummary.aging}
              onRefresh={loadAllFinanceData}
            />
          )}

          {activeTab === "couriers" && (
            <CourierReconciliationView
              couriers={couriers}
              totalExpectedCod={courierTotals.expectedCod}
              totalNetRemittable={courierTotals.netRemittable}
              totalRtoLoss={courierTotals.rtoLoss}
            />
          )}

          {activeTab === "unit_economics" && (
            <UnitEconomicsView items={unitEconomics} onRefresh={loadAllFinanceData} />
          )}

          {activeTab === "treasury" && (
            <TreasuryAccountsView accounts={accounts} totalCashAssets={totalCash} />
          )}
        </>
      )}

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
