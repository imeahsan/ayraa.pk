"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/context/ToastContext";
import { OrderShipment, ShipmentStatus } from "@/types";
import styles from "../../admin.module.css";

const SHIPMENT_STATUSES: Array<ShipmentStatus | "all"> = [
  "all",
  "draft",
  "booked",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "failed_delivery",
  "returned",
  "cancelled",
];

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      type="button"
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "4px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: copied ? "var(--color-success, #4ade80)" : "var(--admin-text-sub, rgba(255,255,255,0.6))",
        transition: "color 0.2s, transform 0.1s",
        marginLeft: "6px",
        verticalAlign: "middle",
      }}
      title="Copy Order ID"
      onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.85)"}
      onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
      onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
};

export default function ShippingQueuePage() {
  const supabase = createClient();
  const toast = useToast();
  const [shipments, setShipments] = useState<OrderShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | "all">("all");
  const [directionFilter, setDirectionFilter] = useState<"all" | "forward" | "reverse">("all");
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      const { data, error } = await supabase
        .from("order_shipments")
        .select("*, shipping_company:shipping_companies(*)")
        .order("created_at", { ascending: false });

      if (error || !data) {
        setShipments([]);
      } else {
        setShipments(data as OrderShipment[]);
      }
    } catch (err) {
      console.error("Failed to load shipment queue:", err);
      setShipments([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredShipments = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return shipments.filter((shipment) => {
      const matchesStatus = statusFilter === "all" || shipment.shipment_status === statusFilter;
      const matchesDirection = directionFilter === "all" || shipment.shipment_direction === directionFilter;
      const matchesSearch =
        shipment.order_id.toLowerCase().includes(term) ||
        (shipment.tracking_number || "").toLowerCase().includes(term) ||
        shipment.recipient_name.toLowerCase().includes(term) ||
        shipment.recipient_phone.includes(searchTerm) ||
        (shipment.shipping_company?.name || shipment.shipping_company_name || "").toLowerCase().includes(term);

      return matchesStatus && matchesDirection && matchesSearch;
    });
  }, [shipments, searchTerm, statusFilter, directionFilter]);

  const metrics = useMemo(() => {
    return {
      total: shipments.length,
      active: shipments.filter((item) => ["booked", "picked_up", "in_transit", "out_for_delivery"].includes(item.shipment_status)).length,
      delivered: shipments.filter((item) => item.shipment_status === "delivered").length,
      exceptions: shipments.filter((item) => ["failed_delivery", "returned", "cancelled"].includes(item.shipment_status)).length,
    };
  }, [shipments]);

  const formatPKR = (amount: number) =>
    Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadgeClass = (status: ShipmentStatus) => {
    if (status === "delivered") return styles.badgeDelivered;
    if (["booked", "picked_up", "in_transit", "out_for_delivery"].includes(status)) return styles.badgeShipped;
    if (status === "draft") return styles.badgePending;
    if (["failed_delivery", "returned", "cancelled"].includes(status)) return styles.badgeCancelled;
    return styles.badgeProcessing;
  };

  const handleStatusUpdate = async (shipmentId: string, nextStatus: ShipmentStatus) => {
    setSavingId(shipmentId);
    try {
      const now = new Date().toISOString();
      const patch: Record<string, any> = {
        shipment_status: nextStatus,
        updated_at: now,
      };
      if (nextStatus === "delivered") patch.delivered_at = now;
      if (nextStatus === "returned") patch.returned_at = now;
      if (["picked_up", "in_transit", "out_for_delivery", "delivered"].includes(nextStatus)) patch.shipped_at = now;

      const { error } = await supabase.from("order_shipments").update(patch).eq("id", shipmentId);
      if (error) throw new Error(error.message);

      setShipments((prev) =>
        prev.map((shipment) =>
          shipment.id === shipmentId ? { ...shipment, ...patch } : shipment
        )
      );
      toast.success("Shipment status updated.");
    } catch (err: any) {
      toast.error(err.message || "Failed to update shipment status.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className={styles.pageLayout}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <Link href="/admin/shipping" className={styles.backLink}>
            &larr; Back to Shipping
          </Link>
        </div>
        <Link href="/admin/orders" className={styles.tableLink}>
          Open Orders
        </Link>
      </div>

      <div className={styles.dashboardGrid}>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Total Shipments</span>
          <h3 className={styles.cardValue}>{metrics.total}</h3>
        </div>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Active In Transit</span>
          <h3 className={styles.cardValue}>{metrics.active}</h3>
        </div>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Delivered</span>
          <h3 className={styles.cardValue}>{metrics.delivered}</h3>
        </div>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Exceptions</span>
          <h3 className={styles.cardValue}>{metrics.exceptions}</h3>
        </div>
      </div>

      <div className={styles.filterContainer}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>Find</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className={styles.searchInput}
            placeholder="Order ID, tracking, courier, recipient..."
          />
        </div>
        <div className={styles.filterWrapper}>
          <span className={styles.filterLabel}>Status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ShipmentStatus | "all")} className={styles.filterSelect}>
            {SHIPMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.filterWrapper}>
          <span className={styles.filterLabel}>Direction</span>
          <select value={directionFilter} onChange={(event) => setDirectionFilter(event.target.value as "all" | "forward" | "reverse")} className={styles.filterSelect}>
            <option value="all">all</option>
            <option value="forward">forward</option>
            <option value="reverse">reverse</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="font-body text-sm text-admin-text-sub text-center py-12">Loading shipment queue...</p>
      ) : filteredShipments.length === 0 ? (
        <div className={styles.tableCard} style={{ padding: "48px", textAlign: "center" }}>
          No shipments found for the selected filters.
        </div>
      ) : (
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <h3 className={styles.tableTitle}>Shipment Queue</h3>
            <span className={styles.dateBadge}>{filteredShipments.length} visible</span>
          </div>
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.tableTh}>Order</th>
                  <th className={styles.tableTh}>Courier</th>
                  <th className={styles.tableTh}>Recipient</th>
                  <th className={styles.tableTh}>Tracking</th>
                  <th className={styles.tableTh}>Direction</th>
                  <th className={styles.tableTh}>Cost</th>
                  <th className={styles.tableTh}>Status</th>
                  <th className={styles.tableTh}>Update</th>
                  <th className={styles.tableTh}>Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredShipments.map((shipment) => (
                  <tr key={shipment.id} className={styles.tableTr}>
                    <td className={styles.tableTd} style={{ whiteSpace: "nowrap" }}>
                      <Link href={`/admin/orders/${shipment.order_id}`} className={styles.tableLink}>
                        {shipment.order_id}
                      </Link>
                      <CopyButton text={shipment.order_id} />
                    </td>
                    <td className={styles.tableTd}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span className={styles.tableTdHighlight}>
                          {shipment.shipping_company?.name || shipment.shipping_company_name || "Manual courier"}
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--admin-text-sub)" }}>
                          {shipment.booking_reference || "No booking ref"}
                        </span>
                      </div>
                    </td>
                    <td className={styles.tableTd}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span className={styles.tableTdHighlight}>{shipment.recipient_name}</span>
                        <span style={{ fontSize: "11px", color: "var(--admin-text-sub)" }}>
                          {shipment.recipient_city} | {shipment.recipient_phone}
                        </span>
                      </div>
                    </td>
                    <td className={styles.tableTd}>
                      {shipment.tracking_url ? (
                        <Link href={shipment.tracking_url} className={styles.tableLink} target="_blank">
                          {shipment.tracking_number || "Open"}
                        </Link>
                      ) : (
                        shipment.tracking_number || "-"
                      )}
                    </td>
                    <td className={styles.tableTd}>{shipment.shipment_direction}</td>
                    <td className={styles.tableTd}>{formatPKR(Number(shipment.shipping_cost || 0))}</td>
                    <td className={styles.tableTd}>
                      <span className={`${styles.badge} ${getStatusBadgeClass(shipment.shipment_status)}`}>
                        {shipment.shipment_status}
                      </span>
                    </td>
                    <td className={styles.tableTd}>
                      <select
                        value={shipment.shipment_status}
                        onChange={(event) => handleStatusUpdate(shipment.id, event.target.value as ShipmentStatus)}
                        className={styles.filterSelect}
                        disabled={savingId === shipment.id}
                      >
                        {SHIPMENT_STATUSES.filter((status): status is ShipmentStatus => status !== "all").map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className={styles.tableTd}>{formatDate(shipment.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
