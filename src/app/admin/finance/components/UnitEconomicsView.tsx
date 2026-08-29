"use client";

import React, { useState } from "react";
import Image from "next/image";
import { UnitEconomicsItem } from "@/types";
import { useToast } from "@/context/ToastContext";
import { updateProductCostPrice } from "@/app/actions/finance";
import styles from "../finance.module.css";

interface UnitEconomicsViewProps {
  items: UnitEconomicsItem[];
  onRefresh?: () => Promise<void>;
}

export const UnitEconomicsView: React.FC<UnitEconomicsViewProps> = ({ items, onRefresh }) => {
  const toast = useToast();
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCostId, setEditingCostId] = useState<string | null>(null);
  const [tempCost, setTempCost] = useState<number | "">("");
  const [savingCost, setSavingCost] = useState(false);

  const handleSaveCost = async (productId: string) => {
    if (tempCost === "" || Number(tempCost) < 0) {
      toast.warning("Please enter a valid cost price.");
      return;
    }

    setSavingCost(true);
    try {
      const res = await updateProductCostPrice(productId, Number(tempCost));
      if (!res.success) throw new Error(res.error);
      toast.success("Cost price updated successfully.");
      setEditingCostId(null);
      if (onRefresh) await onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update cost price.");
    } finally {
      setSavingCost(false);
    }
  };

  const formatPKR = (amount: number) =>
    Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const filteredItems = items.filter((it) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      it.productName.toLowerCase().includes(term) ||
      it.categoryName.toLowerCase().includes(term) ||
      (it.sku && it.sku.toLowerCase().includes(term));
    const matchesTier = tierFilter === "all" || it.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const heroCount = items.filter((it) => it.tier === "hero").length;
  const drainerCount = items.filter((it) => it.tier === "drainer").length;
  const totalUnits = items.reduce((sum, it) => sum + it.unitsSold, 0);
  const totalRevenue = items.reduce((sum, it) => sum + it.grossRevenue, 0);
  const totalCm1 = items.reduce((sum, it) => sum + it.contributionMargin1, 0);
  const totalCm2 = items.reduce((sum, it) => sum + it.contributionMargin2, 0);

  const avgCm1 = totalRevenue > 0 ? (totalCm1 / totalRevenue) * 100 : 0;
  const avgCm2 = totalRevenue > 0 ? (totalCm2 / totalRevenue) * 100 : 0;

  return (
    <div>
      {/* Unit Economics Metrics */}
      <div className={styles.kpiGrid} style={{ marginBottom: "20px" }}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Profit Heroes (High Margin)</div>
          <h3 className={`${styles.kpiValue} ${styles.positive}`}>{heroCount} Products</h3>
          <div className={styles.kpiSub}>CM2 &ge; 35% with active sales</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Profit Drainers (Erosion)</div>
          <h3 className={`${styles.kpiValue} ${styles.negative}`}>{drainerCount} Products</h3>
          <div className={styles.kpiSub}>CM2 &lt; 15% after ad & return costs</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Avg Contribution Margin (CM1)</div>
          <h3 className={`${styles.kpiValue} ${styles.gold}`}>{avgCm1.toFixed(1)}%</h3>
          <div className={styles.kpiSub}>Gross product margin from real COGS</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Avg Net Margin (CM2)</div>
          <h3 className={`${styles.kpiValue} ${styles.blue}`}>{avgCm2.toFixed(1)}%</h3>
          <div className={styles.kpiSub}>True unit profit after real ad & return losses</div>
        </div>
      </div>

      {/* Unit Economics Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeaderBar}>
          <div>
            <h3 className={styles.cardTitle} style={{ margin: 0 }}>SKU & Collection Unit Economics</h3>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--admin-text-sub)" }}>
              Contribution Margin 1 (Price - COGS) and Contribution Margin 2 (After Ad Spend & Return Losses).
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Search product or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "6px 12px",
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "4px",
                color: "#fff",
                fontSize: "12px",
                minWidth: "200px",
              }}
            />

            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              style={{
                padding: "6px 12px",
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "4px",
                color: "#fff",
                fontSize: "12px",
              }}
            >
              <option value="all">All Tiers</option>
              <option value="hero">🏆 Profit Heroes</option>
              <option value="solid">⚖️ Solid Performers</option>
              <option value="drainer">⚠️ Profit Drainers</option>
            </select>
          </div>
        </div>

        <div className={styles.tableResponsive}>
          <table className={styles.financeTable}>
            <thead>
              <tr>
                <th>Product</th>
                <th style={{ textAlign: "center" }}>Units Sold</th>
                <th>Retail Price</th>
                <th>Unit Cost</th>
                <th>CM1 (Gross)</th>
                <th>Est. Ad Cost</th>
                <th>CM2 (True Net)</th>
                <th>Stock Left</th>
                <th>Tier</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it) => (
                <tr key={it.productId}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {it.imageUrl ? (
                        <Image
                          src={it.imageUrl}
                          alt={it.productName}
                          width={36}
                          height={36}
                          style={{ objectFit: "cover", borderRadius: "4px" }}
                        />
                      ) : (
                        <div style={{ width: 36, height: 36, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "4px" }} />
                      )}
                      <div>
                        <strong style={{ color: "#ffffff", display: "block" }}>{it.productName}</strong>
                        <span style={{ fontSize: "11px", color: "var(--color-gold)" }}>{it.categoryName}</span>
                      </div>
                    </div>
                  </td>

                  <td style={{ textAlign: "center", fontWeight: 700 }}>{it.unitsSold}</td>

                  <td style={{ fontSize: "12px" }}>{formatPKR(it.retailPrice)}</td>

                  <td>
                    {editingCostId === it.productId ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <input
                          type="number"
                          min={0}
                          value={tempCost}
                          onChange={(e) => setTempCost(e.target.value === "" ? "" : Number(e.target.value))}
                          placeholder="Cost"
                          style={{
                            width: "80px",
                            padding: "3px 6px",
                            backgroundColor: "#1c1b1b",
                            border: "1px solid var(--color-gold)",
                            borderRadius: "4px",
                            color: "#fff",
                            fontSize: "12px",
                          }}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveCost(it.productId);
                            if (e.key === "Escape") setEditingCostId(null);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveCost(it.productId)}
                          disabled={savingCost}
                          style={{
                            padding: "3px 6px",
                            backgroundColor: "var(--color-gold)",
                            color: "#000",
                            border: "none",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          ✓
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCostId(null)}
                          style={{
                            padding: "3px 6px",
                            backgroundColor: "rgba(255,255,255,0.1)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            fontSize: "11px",
                            cursor: "pointer",
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          setEditingCostId(it.productId);
                          setTempCost(it.costPrice || "");
                        }}
                        style={{
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          backgroundColor: it.costPrice > 0 ? "transparent" : "rgba(234, 179, 8, 0.12)",
                          border: it.costPrice > 0 ? "1px dashed transparent" : "1px dashed rgba(234, 179, 8, 0.4)",
                        }}
                        title="Click to update manufacturing cost"
                      >
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: it.costPrice > 0 ? 500 : 700,
                            color: it.costPrice > 0 ? "var(--admin-text-sub)" : "#fbbf24",
                          }}
                        >
                          {it.costPrice > 0 ? formatPKR(it.costPrice) : "⚠️ Set Cost (Rs 0)"}
                        </span>
                        <span style={{ fontSize: "10px", color: "var(--admin-text-sub)" }}>✏️</span>
                      </div>
                    )}
                  </td>

                  <td>
                    <div style={{ fontWeight: 600, color: "var(--color-gold)" }}>{formatPKR(it.retailPrice - it.costPrice)}</div>
                    <div style={{ fontSize: "10px", color: "var(--admin-text-sub)" }}>{it.cm1Percentage.toFixed(0)}% CM1</div>
                  </td>

                  <td style={{ fontSize: "12px", color: it.estimatedAdSpend > 0 ? "#f87171" : "var(--admin-text-sub)" }}>
                    {it.estimatedAdSpend > 0 ? `- ${formatPKR(it.estimatedAdSpend)}` : "PKR 0"}
                  </td>

                  <td>
                    <div style={{ fontWeight: 700, color: it.cm2Percentage >= 25 ? "#4ade80" : "#fbbf24" }}>
                      {formatPKR(it.contributionMargin2)}
                    </div>
                    <div style={{ fontSize: "10px", color: "var(--admin-text-sub)" }}>{it.cm2Percentage.toFixed(0)}% CM2</div>
                  </td>

                  <td style={{ fontSize: "12px", color: it.stockOnHand <= 3 ? "#f87171" : "inherit" }}>
                    {it.stockOnHand} pcs
                  </td>

                  <td>
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontWeight: 700,
                        backgroundColor:
                          it.tier === "hero"
                            ? "rgba(74, 222, 128, 0.15)"
                            : it.tier === "solid"
                            ? "rgba(96, 165, 250, 0.15)"
                            : "rgba(239, 68, 68, 0.15)",
                        color:
                          it.tier === "hero"
                            ? "#4ade80"
                            : it.tier === "solid"
                            ? "#60a5fa"
                            : "#f87171",
                      }}
                    >
                      {it.tier === "hero" ? "Hero" : it.tier === "solid" ? "Solid" : "Drainer"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
