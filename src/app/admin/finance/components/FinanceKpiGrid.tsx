"use client";

import React from "react";
import { FinancialOverviewStats } from "@/types";
import styles from "../finance.module.css";

interface FinanceKpiGridProps {
  stats: FinancialOverviewStats;
}

export const FinanceKpiGrid: React.FC<FinanceKpiGridProps> = ({ stats }) => {
  const formatPKR = (amount: number) =>
    Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  return (
    <div>
      {/* Primary Financial Pillars */}
      <div className={styles.kpiGrid}>
        {/* Gross Revenue */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>
            <span>Gross Revenue</span>
            <span>💰</span>
          </div>
          <h3 className={styles.kpiValue}>{formatPKR(stats.grossRevenue)}</h3>
          <div className={styles.kpiSub}>
            {stats.totalOrdersCount} Total Orders • AOV: {formatPKR(stats.averageOrderValue)}
          </div>
        </div>

        {/* Net Operating Profit */}
        <div className={styles.kpiCard} style={{ borderColor: stats.netProfit >= 0 ? "rgba(74, 222, 128, 0.4)" : "rgba(248, 113, 113, 0.4)" }}>
          <div className={styles.kpiLabel}>
            <span>Net Operating Profit</span>
            <span style={{ fontSize: "11px", fontWeight: 700, color: stats.netProfitMargin >= 20 ? "#4ade80" : stats.netProfitMargin >= 10 ? "#fbbf24" : "#f87171" }}>
              {stats.netProfitMargin.toFixed(1)}% Margin
            </span>
          </div>
          <h3 className={`${styles.kpiValue} ${stats.netProfit >= 0 ? styles.positive : styles.negative}`}>
            {formatPKR(stats.netProfit)}
          </h3>
          <div className={styles.kpiSub}>
            EBITDA after COGS, Ad Spend, OPEX & RTO Losses
          </div>
        </div>

        {/* Gross Profit & COGS */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>
            <span>Gross Profit</span>
            <span className={styles.gold}>{stats.grossProfitMargin.toFixed(1)}% GM</span>
          </div>
          <h3 className={`${styles.kpiValue} ${styles.gold}`}>{formatPKR(stats.grossProfit)}</h3>
          <div className={styles.kpiSub}>
            COGS: {formatPKR(stats.cogsAmount)} (Net Sales: {formatPKR(stats.netRevenue)})
          </div>
        </div>

        {/* Operating Expenses */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>
            <span>Total Operating Expenses</span>
            <span>📉</span>
          </div>
          <h3 className={`${styles.kpiValue} ${styles.negative}`}>{formatPKR(stats.operatingExpenses)}</h3>
          <div className={styles.kpiSub}>
            Ads: {formatPKR(stats.marketingExpenses)} • Shipping: {formatPKR(stats.shippingExpenses)}
          </div>
        </div>

        {/* Inventory Asset Valuation */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>
            <span>Inventory Asset Valuation</span>
            <span className={styles.blue}>Stock Value</span>
          </div>
          <h3 className={`${styles.kpiValue} ${styles.blue}`}>{formatPKR(stats.inventoryHoldingCost)}</h3>
          <div className={styles.kpiSub}>
            {stats.inventoryTotalUnits} Units in Hub (Retail Value: {formatPKR(stats.inventoryRetailValue)})
          </div>
        </div>

        {/* Pending Courier Remittances */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>
            <span>Pending Courier Float</span>
            <span>🚚</span>
          </div>
          <h3 className={`${styles.kpiValue} ${styles.purple}`}>{formatPKR(stats.pendingCourierRemittance)}</h3>
          <div className={styles.kpiSub}>
            Delivered COD in Transit: {formatPKR(stats.collectedCourierRemittance)}
          </div>
        </div>

        {/* Marketing Efficiency (MER / ROAS) */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>
            <span>Marketing Efficiency (MER)</span>
            <span className={styles.gold}>ROAS Dial</span>
          </div>
          <h3 className={styles.kpiValue}>
            {stats.merRoas > 0 ? `${stats.merRoas.toFixed(2)}x` : "N/A"}
          </h3>
          <div className={styles.kpiSub}>
            Blended CAC: {stats.blendedCac > 0 ? formatPKR(stats.blendedCac) : "N/A"} per order
          </div>
        </div>

        {/* Dead Freight / RTO Loss */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>
            <span>RTO Dead Freight Loss</span>
            <span className={styles.negative}>{stats.rtoRate.toFixed(1)}% RTO</span>
          </div>
          <h3 className={`${styles.kpiValue} ${styles.negative}`}>{formatPKR(stats.rtoShippingLoss)}</h3>
          <div className={styles.kpiSub}>
            {stats.returnedOrdersCount} Return/Rejected shipments freight loss
          </div>
        </div>

        {/* Customer Gifts & PR Samples */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>
            <span>Customer Gifts &amp; PR Samples</span>
            <span className={styles.gold}>🎁 {stats.giftItemsCount} Gift Units</span>
          </div>
          <h3 className={`${styles.kpiValue} ${styles.gold}`}>{formatPKR(stats.giftCogsCost)}</h3>
          <div className={styles.kpiSub}>
            Stock Cost (COGS) • Retail Value: {formatPKR(stats.giftRetailValue)}
          </div>
        </div>
      </div>

      {/* Financial Waterfall Breakdown */}
      <div className={styles.waterfallCard}>
        <div className={styles.cardTitle}>Executive Financial Waterfall (P&L Bridge)</div>
        <div className={styles.cardSubtitle}>
          Real-time step-by-step breakdown from Gross Sales to Net Retained Profit.
        </div>

        <div className={styles.waterfallSteps}>
          <div className={styles.waterfallItem}>
            <div className={styles.waterfallStepLabel}>1. Gross Sales</div>
            <div className={styles.waterfallStepVal}>{formatPKR(stats.grossRevenue)}</div>
          </div>

          <div style={{ textAlign: "center", color: "var(--admin-text-sub)", fontSize: "16px", fontWeight: 700 }}>➔</div>

          <div className={styles.waterfallItem}>
            <div className={styles.waterfallStepLabel}>2. Returns & Discs</div>
            <div className={`${styles.waterfallStepVal} ${styles.negative}`}>
              - {formatPKR(stats.discountsAmount + stats.refundsAmount)}
            </div>
          </div>

          <div style={{ textAlign: "center", color: "var(--admin-text-sub)", fontSize: "16px", fontWeight: 700 }}>➔</div>

          <div className={styles.waterfallItem}>
            <div className={styles.waterfallStepLabel}>3. Net Sales</div>
            <div className={styles.waterfallStepVal}>{formatPKR(stats.netRevenue)}</div>
          </div>

          <div style={{ textAlign: "center", color: "var(--admin-text-sub)", fontSize: "16px", fontWeight: 700 }}>➔</div>

          <div className={styles.waterfallItem}>
            <div className={styles.waterfallStepLabel}>4. COGS (Fabric)</div>
            <div className={`${styles.waterfallStepVal} ${styles.negative}`}>
              - {formatPKR(stats.cogsAmount)}
            </div>
          </div>

          <div style={{ textAlign: "center", color: "var(--admin-text-sub)", fontSize: "16px", fontWeight: 700 }}>➔</div>

          <div className={styles.waterfallItem}>
            <div className={styles.waterfallStepLabel}>5. OPEX & Ads</div>
            <div className={`${styles.waterfallStepVal} ${styles.negative}`}>
              - {formatPKR(stats.operatingExpenses + stats.rtoShippingLoss)}
            </div>
          </div>

          <div style={{ textAlign: "center", color: "var(--admin-text-sub)", fontSize: "16px", fontWeight: 700 }}>=</div>

          <div className={`${styles.waterfallItem} ${styles.waterfallItemHighlight}`}>
            <div className={styles.waterfallStepLabel} style={{ color: "var(--color-gold)" }}>6. Net Profit</div>
            <div className={`${styles.waterfallStepVal} ${stats.netProfit >= 0 ? styles.positive : styles.negative}`}>
              {formatPKR(stats.netProfit)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
