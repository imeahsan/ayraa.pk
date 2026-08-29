"use client";

import React from "react";
import { FinancialAccount } from "@/types";
import styles from "../finance.module.css";

interface TreasuryAccountsViewProps {
  accounts: FinancialAccount[];
  totalCashAssets: number;
}

export const TreasuryAccountsView: React.FC<TreasuryAccountsViewProps> = ({
  accounts,
  totalCashAssets,
}) => {
  const formatPKR = (amount: number) =>
    Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const getAccountIcon = (type: string) => {
    switch (type) {
      case "bank":
        return "🏦";
      case "cash_till":
        return "💵";
      case "courier_wallet":
        return "🚚";
      default:
        return "💳";
    }
  };

  return (
    <div>
      {/* Treasury Header */}
      <div className={styles.kpiGrid} style={{ marginBottom: "20px" }}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Total Liquid Treasury Assets</div>
          <h3 className={`${styles.kpiValue} ${styles.positive}`}>{formatPKR(totalCashAssets)}</h3>
          <div className={styles.kpiSub}>Combined cash across bank, POS till, and courier floats</div>
        </div>
      </div>

      {/* Account Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {accounts.map((acc) => (
          <div key={acc.id} className={styles.waterfallCard} style={{ margin: 0, padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "24px" }}>{getAccountIcon(acc.account_type)}</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#ffffff" }}>{acc.name}</h4>
                  <span style={{ fontSize: "11px", color: "var(--admin-text-sub)" }}>{acc.bank_name || "Account"}</span>
                </div>
              </div>
              <span style={{ fontSize: "10px", backgroundColor: "rgba(74, 222, 128, 0.15)", color: "#4ade80", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
                ACTIVE
              </span>
            </div>

            <div style={{ margin: "16px 0 8px" }}>
              <span style={{ fontSize: "11px", color: "var(--admin-text-sub)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Current Balance
              </span>
              <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-gold)", marginTop: "2px" }}>
                {formatPKR(acc.balance)}
              </div>
            </div>

            {acc.account_number && (
              <div style={{ fontSize: "11px", color: "var(--admin-text-sub)", fontFamily: "monospace", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px", marginTop: "12px" }}>
                Acc #: {acc.account_number}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
