"use client";

import React, { useState } from "react";
import Image from "next/image";
import { InventoryAgingItem } from "@/types";
import { useToast } from "@/context/ToastContext";
import { updateProductCostPrice } from "@/app/actions/finance";
import styles from "../finance.module.css";

interface InventoryValuationViewProps {
  items: InventoryAgingItem[];
  totalHoldingCost: number;
  totalRetailValue: number;
  totalStockUnits: number;
  agingSummary: { fresh: number; mature: number; dead: number };
  onRefresh?: () => Promise<void>;
}

export const InventoryValuationView: React.FC<InventoryValuationViewProps> = ({
  items,
  totalHoldingCost,
  totalRetailValue,
  totalStockUnits,
  agingSummary,
  onRefresh,
}) => {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [agingFilter, setAgingFilter] = useState<string>("all");
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

  const filteredItems = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      item.productName.toLowerCase().includes(term) ||
      item.categoryName.toLowerCase().includes(term);
    const matchesAging = agingFilter === "all" || item.agingBracket === agingFilter;
    return matchesSearch && matchesAging;
  });

  const totalFilteredHolding = filteredItems.reduce((sum, it) => sum + it.totalCostValue, 0);

  return (
    <div>
      {/* Valuation Summary Grid */}
      <div className={styles.kpiGrid} style={{ marginBottom: "20px" }}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Total Holding Cost (COGS)</div>
          <h3 className={`${styles.kpiValue} ${styles.gold}`}>{formatPKR(totalHoldingCost)}</h3>
          <div className={styles.kpiSub}>Total capital locked in warehouse inventory</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Total Potential Retail Value</div>
          <h3 className={`${styles.kpiValue} ${styles.positive}`}>{formatPKR(totalRetailValue)}</h3>
          <div className={styles.kpiSub}>
            Projected Profit: {formatPKR(totalRetailValue - totalHoldingCost)}
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Total Stock Units</div>
          <h3 className={styles.kpiValue}>{totalStockUnits} Units</h3>
          <div className={styles.kpiSub}>Across all collections and active size variants</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Dead Capital (&gt;60 Days)</div>
          <h3 className={`${styles.kpiValue} ${styles.negative}`}>{formatPKR(agingSummary.dead)}</h3>
          <div className={styles.kpiSub}>Unsold stock aged over 60 days</div>
        </div>
      </div>

      {/* Stock Aging Segmentation Heatmap */}
      <div className={styles.waterfallCard} style={{ marginBottom: "20px" }}>
        <div className={styles.cardTitle}>Inventory Aging & Capital Velocity Breakdown</div>
        <div className={styles.cardSubtitle}>
          Distribution of locked capital across inventory aging brackets.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "rgba(34, 197, 94, 0.08)",
              border: "1px solid rgba(34, 197, 94, 0.25)",
              borderRadius: "6px",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#4ade80", textTransform: "uppercase" }}>
              🟢 Fresh Stock (&lt; 30 Days)
            </div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff", marginTop: "4px" }}>
              {formatPKR(agingSummary.fresh)}
            </div>
            <div style={{ fontSize: "11px", color: "var(--admin-text-sub)", marginTop: "2px" }}>
              {totalHoldingCost > 0 ? ((agingSummary.fresh / totalHoldingCost) * 100).toFixed(0) : 0}% of inventory capital
            </div>
          </div>

          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "rgba(234, 179, 8, 0.08)",
              border: "1px solid rgba(234, 179, 8, 0.25)",
              borderRadius: "6px",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#fbbf24", textTransform: "uppercase" }}>
              🟡 Mature Stock (30–60 Days)
            </div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff", marginTop: "4px" }}>
              {formatPKR(agingSummary.mature)}
            </div>
            <div style={{ fontSize: "11px", color: "var(--admin-text-sub)", marginTop: "2px" }}>
              {totalHoldingCost > 0 ? ((agingSummary.mature / totalHoldingCost) * 100).toFixed(0) : 0}% of inventory capital
            </div>
          </div>

          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              borderRadius: "6px",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#f87171", textTransform: "uppercase" }}>
              🔴 Stagnant / Dead Stock (&gt; 60 Days)
            </div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff", marginTop: "4px" }}>
              {formatPKR(agingSummary.dead)}
            </div>
            <div style={{ fontSize: "11px", color: "var(--admin-text-sub)", marginTop: "2px" }}>
              Recommend clearance flash sales or bundling
            </div>
          </div>
        </div>
      </div>

      {/* Itemized Inventory Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeaderBar}>
          <div>
            <h3 className={styles.cardTitle} style={{ margin: 0 }}>Itemized Stock Valuation & Capital Lockup</h3>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--admin-text-sub)" }}>
              {filteredItems.length} Products • Filtered Capital Lockup:{" "}
              <strong style={{ color: "var(--color-gold)" }}>{formatPKR(totalFilteredHolding)}</strong>
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Search product or collection..."
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
              value={agingFilter}
              onChange={(e) => setAgingFilter(e.target.value)}
              style={{
                padding: "6px 12px",
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "4px",
                color: "#fff",
                fontSize: "12px",
              }}
            >
              <option value="all">All Aging Brackets</option>
              <option value="<30_days">Fresh (&lt; 30 days)</option>
              <option value="30-60_days">Mature (30-60 days)</option>
              <option value=">60_days">Stagnant (&gt; 60 days)</option>
            </select>
          </div>
        </div>

        <div className={styles.tableResponsive}>
          <table className={styles.financeTable}>
            <thead>
              <tr>
                <th>Product / Collection</th>
                <th style={{ width: "90px" }}>Stock Units</th>
                <th>Unit Cost</th>
                <th>Retail Price</th>
                <th>Holding Value (Cost)</th>
                <th>Retail Potential</th>
                <th>Projected Profit</th>
                <th>Aging Bracket</th>
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

                  <td style={{ fontWeight: 700 }}>{it.totalStock}</td>

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
                          setTempCost(it.unitCost || "");
                        }}
                        style={{
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          backgroundColor: it.unitCost > 0 ? "transparent" : "rgba(234, 179, 8, 0.12)",
                          border: it.unitCost > 0 ? "1px dashed transparent" : "1px dashed rgba(234, 179, 8, 0.4)",
                        }}
                        title="Click to update manufacturing cost"
                      >
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: it.unitCost > 0 ? 500 : 700,
                            color: it.unitCost > 0 ? "var(--admin-text-sub)" : "#fbbf24",
                          }}
                        >
                          {it.unitCost > 0 ? formatPKR(it.unitCost) : "⚠️ Set Cost (Rs 0)"}
                        </span>
                        <span style={{ fontSize: "10px", color: "var(--admin-text-sub)" }}>✏️</span>
                      </div>
                    )}
                  </td>

                  <td style={{ fontSize: "12px" }}>
                    {formatPKR(it.unitPrice)}
                  </td>

                  <td style={{ fontWeight: 700, color: "var(--color-gold)" }}>
                    {formatPKR(it.totalCostValue)}
                  </td>

                  <td style={{ fontSize: "12px" }}>
                    {formatPKR(it.totalRetailValue)}
                  </td>

                  <td style={{ fontWeight: 600, color: "#4ade80" }}>
                    {formatPKR(it.projectedProfit)}
                  </td>

                  <td>
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontWeight: 700,
                        backgroundColor:
                          it.agingBracket === "<30_days"
                            ? "rgba(34, 197, 94, 0.15)"
                            : it.agingBracket === "30-60_days"
                            ? "rgba(234, 179, 8, 0.15)"
                            : "rgba(239, 68, 68, 0.15)",
                        color:
                          it.agingBracket === "<30_days"
                            ? "#4ade80"
                            : it.agingBracket === "30-60_days"
                            ? "#fbbf24"
                            : "#f87171",
                      }}
                    >
                      {it.agingBracket === "<30_days" ? "Fresh (<30d)" : it.agingBracket === "30-60_days" ? "Mature (30-60d)" : "Stagnant (>60d)"}
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
