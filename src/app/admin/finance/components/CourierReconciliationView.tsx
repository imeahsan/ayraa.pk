"use client";

import React from "react";
import { CourierRemittanceBreakdown } from "@/types";
import styles from "../finance.module.css";

interface CourierReconciliationViewProps {
  couriers: CourierRemittanceBreakdown[];
  totalExpectedCod: number;
  totalNetRemittable: number;
  totalRtoLoss: number;
}

export const CourierReconciliationView: React.FC<CourierReconciliationViewProps> = ({
  couriers,
  totalExpectedCod,
  totalNetRemittable,
  totalRtoLoss,
}) => {
  const formatPKR = (amount: number) =>
    Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const totalDeliveryCharges = couriers.reduce((sum, c) => sum + c.estimatedDeliveryCharges, 0);
  const totalHandlingFee = couriers.reduce((sum, c) => sum + c.estimatedCodHandlingFee, 0);
  const totalDeductions = totalDeliveryCharges + totalHandlingFee;

  return (
    <div>
      {/* Top Courier Metrics */}
      <div className={styles.kpiGrid} style={{ marginBottom: "20px" }}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Expected COD Collected</div>
          <h3 className={`${styles.kpiValue} ${styles.gold}`}>{formatPKR(totalExpectedCod)}</h3>
          <div className={styles.kpiSub}>Gross cash collected from customers by couriers</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Courier Service Fees & Handling</div>
          <h3 className={`${styles.kpiValue} ${styles.negative}`}>- {formatPKR(totalDeductions)}</h3>
          <div className={styles.kpiSub}>
            Freight: {formatPKR(totalDeliveryCharges)} • COD Fee (1.5%): {formatPKR(totalHandlingFee)}
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Net Remittable to Bank</div>
          <h3 className={`${styles.kpiValue} ${styles.positive}`}>{formatPKR(totalNetRemittable)}</h3>
          <div className={styles.kpiSub}>Actual net funds scheduled for bank deposit</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>RTO Dead Freight Losses</div>
          <h3 className={`${styles.kpiValue} ${styles.negative}`}>{formatPKR(totalRtoLoss)}</h3>
          <div className={styles.kpiSub}>Two-way freight paid on cancelled / refused orders</div>
        </div>
      </div>

      {/* Courier Breakdown Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeaderBar}>
          <div>
            <h3 className={styles.cardTitle} style={{ margin: 0 }}>Courier COD Remittance Reconciliation</h3>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--admin-text-sub)" }}>
              Detailed breakdown of cash collection, deductions, and net payout by shipping company.
            </p>
          </div>
        </div>

        <div className={styles.tableResponsive}>
          {couriers.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <span style={{ fontSize: "32px" }}>🚚</span>
              <p style={{ margin: "10px 0 0", color: "var(--admin-text-sub)", fontSize: "13px" }}>
                No courier shipment remittance records currently found.
              </p>
            </div>
          ) : (
            <table className={styles.financeTable}>
              <thead>
                <tr>
                  <th>Courier Service</th>
                  <th style={{ textAlign: "center" }}>Delivered Orders</th>
                  <th>Expected Gross COD</th>
                  <th>Delivery Charges</th>
                  <th>COD Handling Fee</th>
                  <th>Net Payout (Remittance)</th>
                  <th style={{ textAlign: "center" }}>RTO Orders</th>
                  <th>Dead Freight Loss</th>
                </tr>
              </thead>
              <tbody>
                {couriers.map((c) => (
                  <tr key={c.courierName}>
                    <td>
                      <strong style={{ color: "#ffffff" }}>{c.courierName}</strong>
                    </td>

                    <td style={{ textAlign: "center", fontWeight: 600 }}>
                      {c.deliveredOrdersCount}
                    </td>

                    <td style={{ fontWeight: 700, color: "var(--color-gold)" }}>
                      {formatPKR(c.expectedCodTotal)}
                    </td>

                    <td style={{ fontSize: "12px", color: "#f87171" }}>
                      - {formatPKR(c.estimatedDeliveryCharges)}
                    </td>

                    <td style={{ fontSize: "12px", color: "#f87171" }}>
                      - {formatPKR(c.estimatedCodHandlingFee)}
                    </td>

                    <td style={{ fontWeight: 700, color: "#4ade80", fontSize: "14px" }}>
                      {formatPKR(c.netRemittableAmount)}
                    </td>

                    <td style={{ textAlign: "center", color: "#f87171", fontWeight: 600 }}>
                      {c.rtoOrdersCount}
                    </td>

                    <td style={{ color: "#f87171", fontSize: "12px" }}>
                      {formatPKR(c.rtoFreightLoss)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
