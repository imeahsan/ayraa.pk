"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Order, OrderShipment, OrderStatus } from "@/types";
import styles from "../admin.module.css";

const MOCK_ORDERS: Order[] = [
  {
    id: "AYR-00142",
    user_id: null,
    status: "processing",
    payment_method: "cod",
    subtotal: 145000,
    shipping_cost: 0,
    total: 145000,
    shipping_address: {
      first_name: "Zahra",
      last_name: "Ahmed",
      address_line_1: "Block 5, Clifton",
      city: "Karachi",
      state: "Sindh",
      postal_code: "75500",
      country: "Pakistan",
    },
    contact_phone: "0300-1234567",
    contact_email: "zahra@example.com",
    city: "Karachi",
    created_at: new Date().toISOString(),
  },
  {
    id: "AYR-00141",
    user_id: null,
    status: "shipped",
    payment_method: "cod",
    subtotal: 85500,
    shipping_cost: 0,
    total: 85500,
    shipping_address: {
      first_name: "Fatima",
      last_name: "Khan",
      address_line_1: "DHA Phase 6",
      city: "Lahore",
      state: "Punjab",
      postal_code: "54000",
      country: "Pakistan",
    },
    contact_phone: "0321-7654321",
    contact_email: "fatima@example.com",
    city: "Lahore",
    created_at: new Date().toISOString(),
  },
  {
    id: "AYR-00140",
    user_id: null,
    status: "delivered",
    payment_method: "cod",
    subtotal: 210000,
    shipping_cost: 0,
    total: 210000,
    shipping_address: {
      first_name: "Ayesha",
      last_name: "Tariq",
      address_line_1: "F-7/2",
      city: "Islamabad",
      state: "Islamabad",
      postal_code: "44000",
      country: "Pakistan",
    },
    contact_phone: "0333-9876543",
    contact_email: "ayesha@example.com",
    city: "Islamabad",
    created_at: new Date().toISOString(),
  },
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

export default function AdminOrdersPage() {
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*, shipments:order_shipments(*)")
          .order("created_at", { ascending: false });

        if (error || !data || data.length === 0) {
          setOrders(MOCK_ORDERS);
        } else {
          setOrders(data as Order[]);
        }
      } catch (err) {
        console.error("Failed to fetch orders:", err);
        setOrders(MOCK_ORDERS);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [supabase]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shipping_address.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shipping_address.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.contact_phone.includes(searchTerm);

      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const formatPKR = (amount: number) => {
    return Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case "processing":
        return styles.badgeProcessing;
      case "shipped":
        return styles.badgeShipped;
      case "delivered":
        return styles.badgeDelivered;
      case "pending":
        return styles.badgePending;
      case "cancelled":
        return styles.badgeCancelled;
      default:
        return "";
    }
  };

  return (
    <div className={styles.pageLayout}>
      <div className={styles.filterContainer}>
        {/* Search bar */}
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search orders by ID, customer name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Status Filter */}
        <div className={styles.filterWrapper}>
          <span className={styles.filterLabel}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all" className={styles.filterOption}>All Statuses</option>
            <option value="pending" className={styles.filterOption}>Pending</option>
            <option value="processing" className={styles.filterOption}>Processing</option>
            <option value="shipped" className={styles.filterOption}>Shipped</option>
            <option value="delivered" className={styles.filterOption}>Delivered</option>
            <option value="cancelled" className={styles.filterOption}>Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="font-body text-sm text-admin-text-sub text-center py-12">Loading orders list...</p>
      ) : filteredOrders.length === 0 ? (
        <div className={styles.tableCard} style={{ padding: "48px", textAlign: "center" }}>
          No orders found matching filters.
        </div>
      ) : (
        <div className={styles.tableCard}>
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.tableTh}>Order ID</th>
                  <th className={styles.tableTh}>Customer</th>
                  <th className={styles.tableTh}>City</th>
                  <th className={styles.tableTh}>Total</th>
                  <th className={styles.tableTh}>Status</th>
                  <th className={styles.tableTh}>Shipment</th>
                  <th className={styles.tableTh}>Order Date</th>
                  <th className={styles.tableTh}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const latestForwardShipment = ((order.shipments || []) as OrderShipment[])
                    .filter((shipment) => shipment.shipment_direction === "forward")
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
                  return (
                    <tr key={order.id} className={styles.tableTr}>
                      <td className={`${styles.tableTd} ${styles.tableTdHighlight}`} style={{ whiteSpace: "nowrap" }}>
                        <Link href={`/admin/orders/${order.id}`} className={styles.tableLink}>{order.id}</Link>
                        <CopyButton text={order.id} />
                      </td>
                      <td className={styles.tableTd}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span className={styles.tableTdHighlight}>
                            {order.shipping_address.first_name}{" "}
                            {order.shipping_address.last_name}
                          </span>
                          <span style={{ fontSize: "11px", color: "var(--admin-text-sub)" }}>
                            {order.contact_phone}
                          </span>
                        </div>
                      </td>
                      <td className={styles.tableTd} style={{ textTransform: "capitalize" }}>{order.city}</td>
                      <td className={`${styles.tableTd} ${styles.tableTdHighlight}`}>{formatPKR(order.total)}</td>
                      <td className={styles.tableTd}>
                        <span className={`${styles.badge} ${getStatusBadgeClass(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className={styles.tableTd}>
                        {latestForwardShipment ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={{ fontSize: "12px", color: "var(--admin-text)" }}>
                              {latestForwardShipment.shipping_company_name || "Courier assigned"}
                            </span>
                            <span style={{ fontSize: "11px", color: "var(--admin-text-sub)" }}>
                              {latestForwardShipment.tracking_number || latestForwardShipment.shipment_status}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: "11px", color: "var(--admin-text-sub)" }}>Not booked</span>
                        )}
                      </td>
                      <td className={styles.tableTd} style={{ fontSize: "12px" }}>
                        {formatDate(order.created_at)}
                      </td>
                      <td className={styles.tableTd}>
                        <Link href={`/admin/orders/${order.id}`} className={styles.tableLink}>
                          Manage Order &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
