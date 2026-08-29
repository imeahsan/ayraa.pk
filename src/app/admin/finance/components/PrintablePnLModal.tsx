"use client";

import React from "react";
import { Expense, FinancialOverviewStats } from "@/types";
import { Button } from "@/components/storefront/Button/Button";

interface PrintablePnLModalProps {
  stats: FinancialOverviewStats;
  expenses: Expense[];
  onClose: () => void;
}

export const PrintablePnLModal: React.FC<PrintablePnLModalProps> = ({ stats, expenses, onClose }) => {
  const formatPKR = (amount: number) =>
    Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const downloadCsv = () => {
    const rows = [
      ["Ayra Collection - Executive Financial Ledger & P&L"],
      [`Period: ${stats.period.label} (${stats.period.from.slice(0, 10)} to ${stats.period.to.slice(0, 10)})`],
      [""],
      ["Metric", "Amount (PKR)"],
      ["Gross Revenue", stats.grossRevenue],
      ["Discounts & Promos", stats.discountsAmount],
      ["Returns & Refunds", stats.refundsAmount],
      ["Net Realized Revenue", stats.netRevenue],
      ["Cost of Goods Sold (COGS)", stats.cogsAmount],
      ["Gross Profit", stats.grossProfit],
      ["Gross Profit Margin %", `${stats.grossProfitMargin.toFixed(2)}%`],
      ["Total Operating Expenses", stats.operatingExpenses],
      ["Marketing & Ads", stats.marketingExpenses],
      ["Logistics & Shipping Overages", stats.shippingExpenses],
      ["Salaries & Wages", stats.salariesExpenses],
      ["RTO Dead Freight Losses", stats.rtoShippingLoss],
      ["Net Operating Profit (EBITDA)", stats.netProfit],
      ["Net Profit Margin %", `${stats.netProfitMargin.toFixed(2)}%`],
      [""],
      ["Itemized Expenses Log"],
      ["Date", "Title", "Category", "Amount (PKR)", "Vendor", "Payment Method", "Reference #"],
      ...expenses.map((e) => [
        e.expense_date,
        e.title,
        e.category,
        e.amount,
        e.vendor || "",
        e.payment_method,
        e.reference_number || "",
      ]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Ayra_Financial_Report_${stats.period.label.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(6px)",
        zIndex: 1200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          color: "#111111",
          borderRadius: "8px",
          width: "100%",
          maxWidth: "760px",
          maxHeight: "92vh",
          overflowY: "auto",
          padding: "36px",
          fontFamily: "Arial, sans-serif",
          boxShadow: "0 24px 60px rgba(0,0,0,0.9)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #111", paddingBottom: "14px", marginBottom: "24px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>
              Ayra Collection
            </h1>
            <span style={{ fontSize: "13px", color: "#555" }}>Executive Profit & Loss (P&L) Statement</span>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "14px", fontWeight: 700 }}>Period: {stats.period.label}</div>
            <div style={{ fontSize: "11px", color: "#666" }}>
              {stats.period.from.slice(0, 10)} to {stats.period.to.slice(0, 10)}
            </div>
          </div>
        </div>

        {/* P&L Statement Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", marginBottom: "28px" }}>
          <tbody>
            <tr style={{ backgroundColor: "#f4f4f4", fontWeight: 700 }}>
              <td style={{ padding: "8px" }}>1. Gross Sales Revenue</td>
              <td style={{ padding: "8px", textAlign: "right" }}>{formatPKR(stats.grossRevenue)}</td>
            </tr>
            <tr>
              <td style={{ padding: "6px 8px 6px 24px", color: "#555" }}>Less: Discounts & Promo Codes</td>
              <td style={{ padding: "6px 8px", textAlign: "right", color: "#b91c1c" }}>- {formatPKR(stats.discountsAmount)}</td>
            </tr>
            <tr>
              <td style={{ padding: "6px 8px 6px 24px", color: "#555" }}>Less: Customer Returns & Refunds</td>
              <td style={{ padding: "6px 8px", textAlign: "right", color: "#b91c1c" }}>- {formatPKR(stats.refundsAmount)}</td>
            </tr>
            <tr style={{ borderTop: "1px solid #ccc", borderBottom: "1px solid #ccc", fontWeight: 700, backgroundColor: "#fafafa" }}>
              <td style={{ padding: "8px" }}>2. Net Sales Revenue</td>
              <td style={{ padding: "8px", textAlign: "right" }}>{formatPKR(stats.netRevenue)}</td>
            </tr>

            <tr>
              <td style={{ padding: "8px 8px 8px 24px", color: "#333" }}>Less: Cost of Goods Sold (COGS - Fabric & Sourcing)</td>
              <td style={{ padding: "8px", textAlign: "right", color: "#b91c1c" }}>- {formatPKR(stats.cogsAmount)}</td>
            </tr>
            <tr style={{ borderTop: "1px solid #111", borderBottom: "1px solid #111", fontWeight: 800, backgroundColor: "#f0fdf4" }}>
              <td style={{ padding: "8px", color: "#166534" }}>3. Gross Profit (Margin: {stats.grossProfitMargin.toFixed(1)}%)</td>
              <td style={{ padding: "8px", textAlign: "right", color: "#166534" }}>{formatPKR(stats.grossProfit)}</td>
            </tr>

            <tr style={{ backgroundColor: "#f4f4f4", fontWeight: 700 }}>
              <td style={{ padding: "8px" }} colSpan={2}>4. Operating Expenses (OPEX)</td>
            </tr>
            <tr>
              <td style={{ padding: "6px 8px 6px 24px", color: "#555" }}>Marketing & Paid Ad Spend (Meta/Google)</td>
              <td style={{ padding: "6px 8px", textAlign: "right" }}>{formatPKR(stats.marketingExpenses)}</td>
            </tr>
            <tr>
              <td style={{ padding: "6px 8px 6px 24px", color: "#555" }}>Customer Gifts & PR Samples (Stock COGS)</td>
              <td style={{ padding: "6px 8px", textAlign: "right", color: stats.giftCogsCost > 0 ? "#b45309" : "#555" }}>
                {formatPKR(stats.giftCogsCost)} ({stats.giftItemsCount} units)
              </td>
            </tr>
            <tr>
              <td style={{ padding: "6px 8px 6px 24px", color: "#555" }}>Logistics & Delivery Overages</td>
              <td style={{ padding: "6px 8px", textAlign: "right" }}>{formatPKR(stats.shippingExpenses)}</td>
            </tr>
            <tr>
              <td style={{ padding: "6px 8px 6px 24px", color: "#555" }}>Salaries & Staff Wages</td>
              <td style={{ padding: "6px 8px", textAlign: "right" }}>{formatPKR(stats.salariesExpenses)}</td>
            </tr>
            <tr>
              <td style={{ padding: "6px 8px 6px 24px", color: "#555" }}>Rent, Utilities & Maintenance</td>
              <td style={{ padding: "6px 8px", textAlign: "right" }}>{formatPKR(stats.otherExpenses)}</td>
            </tr>
            <tr>
              <td style={{ padding: "6px 8px 6px 24px", color: "#555" }}>RTO Dead Freight Shipping Losses</td>
              <td style={{ padding: "6px 8px", textAlign: "right", color: "#b91c1c" }}>{formatPKR(stats.rtoShippingLoss)}</td>
            </tr>
            <tr style={{ borderTop: "1px solid #ccc", fontWeight: 700 }}>
              <td style={{ padding: "8px" }}>Total Operating Outflows</td>
              <td style={{ padding: "8px", textAlign: "right", color: "#b91c1c" }}>
                - {formatPKR(stats.operatingExpenses + stats.rtoShippingLoss)}
              </td>
            </tr>

            <tr style={{ borderTop: "2px solid #111", borderBottom: "2px solid #111", fontWeight: 900, fontSize: "15px", backgroundColor: stats.netProfit >= 0 ? "#ecfdf5" : "#fef2f2" }}>
              <td style={{ padding: "10px 8px", color: stats.netProfit >= 0 ? "#15803d" : "#b91c1c" }}>
                5. Net Operating Profit (EBITDA) - Margin: {stats.netProfitMargin.toFixed(1)}%
              </td>
              <td style={{ padding: "10px 8px", textAlign: "right", color: stats.netProfit >= 0 ? "#15803d" : "#b91c1c" }}>
                {formatPKR(stats.netProfit)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Audit & Signatures */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "32px", paddingTop: "16px", borderTop: "1px dashed #ccc", fontSize: "12px" }}>
          <div>
            <div>Prepared By: <strong>Ayra Finance & Analytics System</strong></div>
            <div style={{ marginTop: "6px" }}>Generated on: {new Date().toLocaleDateString("en-PK")}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div>Executive Signoff: _____________________</div>
            <div style={{ marginTop: "6px" }}>Managing Director / CFO</div>
          </div>
        </div>

        {/* Actions Bar */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px", borderTop: "1px solid #eee", paddingTop: "16px" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 16px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              backgroundColor: "#fff",
              cursor: "pointer",
            }}
          >
            Close
          </button>
          <button
            type="button"
            onClick={downloadCsv}
            style={{
              padding: "8px 16px",
              borderRadius: "4px",
              border: "1px solid #111",
              backgroundColor: "#f4f4f4",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            📥 Download CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            style={{
              padding: "8px 18px",
              borderRadius: "4px",
              border: "none",
              backgroundColor: "#111",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            🖨️ Print Statement
          </button>
        </div>
      </div>
    </div>
  );
};
