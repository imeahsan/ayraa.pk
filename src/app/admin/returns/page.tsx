"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/context/ToastContext";
import {
  Order,
  OrderItem,
  OrderReturnRequest,
  ReturnConditionStatus,
  ReturnRequestStatus,
  ReturnRequestType,
  ReturnRestockAction,
} from "@/types";
import { Button } from "@/components/storefront/Button/Button";
import { createReturnCase } from "@/app/actions/returns";
import styles from "../admin.module.css";

type ReturnLineDraft = {
  order_item_id: string;
  selected: boolean;
  quantity: number;
  max_quantity: number;
  unit_price: number;
  reason: string;
  condition_status: ReturnConditionStatus;
  restock_action: ReturnRestockAction;
  refund_amount: number;
  product_name: string;
  variant_size?: string;
  image_url?: string;
};

const TAB_FILTERS = [
  { key: "all", label: "All Cases" },
  { key: "requested", label: "Needs Review", statuses: ["requested"] },
  { key: "in_transit", label: "In Reverse Transit", statuses: ["approved"] },
  { key: "warehouse_qc", label: "Warehouse QC", statuses: ["received", "inspected"] },
  { key: "resolved", label: "Resolved", statuses: ["resolved"] },
  { key: "rejected", label: "Rejected / Cancelled", statuses: ["rejected", "cancelled"] },
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
        marginLeft: "4px",
        verticalAlign: "middle",
      }}
      title="Copy to clipboard"
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.85)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {copied ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
};

export default function AdminReturnsPage() {
  const router = useRouter();
  const supabase = createClient();
  const toast = useToast();

  const [returns, setReturns] = useState<OrderReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<ReturnRequestType | "all">("all");

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [orderIdInput, setOrderIdInput] = useState("");
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [loadedOrder, setLoadedOrder] = useState<Order | null>(null);
  const [existingOrderReturns, setExistingOrderReturns] = useState<OrderReturnRequest[]>([]);
  const [requestType, setRequestType] = useState<ReturnRequestType>("return");
  const [caseReason, setCaseReason] = useState("");
  const [caseNotes, setCaseNotes] = useState("");
  const [lineDrafts, setLineDrafts] = useState<ReturnLineDraft[]>([]);

  useEffect(() => {
    fetchReturns();
  }, []);

  useEffect(() => {
    const initialOrderId = new URLSearchParams(window.location.search).get("orderId") || "";
    if (initialOrderId) {
      setOrderIdInput(initialOrderId);
      setShowCreateModal(true);
      loadOrder(initialOrderId);
    }
  }, []);

  async function fetchReturns() {
    try {
      const { data, error } = await supabase
        .from("order_return_requests")
        .select("*, order:orders!order_return_requests_order_id_fkey(*), items:order_return_items(*)")
        .order("created_at", { ascending: false });

      if (error || !data) {
        setReturns([]);
      } else {
        setReturns(data as OrderReturnRequest[]);
      }
    } catch (err) {
      console.error("Failed to load returns:", err);
      setReturns([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadOrder(targetOrderId = orderIdInput.trim()) {
    if (!targetOrderId) return;

    setLoadingOrder(true);
    try {
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", targetOrderId)
        .single();

      if (orderError || !orderData) {
        toast.error(`Order "${targetOrderId}" not found.`);
        setLoadedOrder(null);
        setLineDrafts([]);
        return;
      }

      // Check existing returns for this order
      const { data: existingReturns } = await supabase
        .from("order_return_requests")
        .select("*, items:order_return_items(*)")
        .eq("order_id", targetOrderId);

      setExistingOrderReturns((existingReturns || []) as OrderReturnRequest[]);

      // Load items with products & images
      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select(`
          *,
          product:products (
            id, name, slug,
            images:product_images ( url, is_primary )
          ),
          variant:product_variants ( id, size, color )
        `)
        .eq("order_id", targetOrderId)
        .order("id", { ascending: true });

      if (itemsError) {
        toast.error(`Failed to load order items: ${itemsError.message}`);
        setLoadedOrder(null);
        setLineDrafts([]);
        return;
      }

      const order = {
        ...(orderData as Order),
        items: (itemsData || []) as OrderItem[],
      };
      const items = order.items || [];

      if (items.length === 0) {
        toast.warning("This order has no items available for return or exchange.");
        setLoadedOrder(order);
        setLineDrafts([]);
        return;
      }

      setLoadedOrder(order);
      setOrderIdInput(order.id);
      setCaseReason("");
      setCaseNotes("");

      setLineDrafts(
        items.map((item: any) => {
          const primaryImg =
            item.product?.images?.find((img: any) => img.is_primary)?.url ||
            item.product?.images?.[0]?.url;
          const uPrice = Number(item.unit_price || 0);

          return {
            order_item_id: item.id,
            selected: true,
            quantity: 1,
            max_quantity: Number(item.quantity || 1),
            unit_price: uPrice,
            reason: "",
            condition_status: "unused",
            restock_action: "inspect_later",
            refund_amount: uPrice, // 1 * unit_price initially
            product_name: item.product?.name || "Product",
            variant_size: item.variant?.size,
            image_url: primaryImg,
          };
        })
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to load order.");
    } finally {
      setLoadingOrder(false);
    }
  }

  const filteredReturns = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return returns.filter((item) => {
      const matchesSearch =
        item.id.toLowerCase().includes(term) ||
        item.order_id.toLowerCase().includes(term) ||
        item.customer_name.toLowerCase().includes(term) ||
        item.customer_phone.includes(searchTerm) ||
        (item.reverse_tracking_number && item.reverse_tracking_number.toLowerCase().includes(term));

      let matchesTab = true;
      if (activeTab !== "all") {
        const tabConfig = TAB_FILTERS.find((t) => t.key === activeTab);
        if (tabConfig?.statuses) {
          matchesTab = tabConfig.statuses.includes(item.status);
        }
      }

      const matchesType = typeFilter === "all" || item.request_type === typeFilter;
      return matchesSearch && matchesTab && matchesType;
    });
  }, [returns, searchTerm, activeTab, typeFilter]);

  const metrics = useMemo(() => {
    const active = returns.filter((item) => !["cancelled", "rejected"].includes(item.status));
    return {
      total: returns.length,
      requested: returns.filter((item) => item.status === "requested").length,
      inTransit: returns.filter((item) => item.status === "approved").length,
      qcPending: returns.filter((item) => ["received", "inspected"].includes(item.status)).length,
      resolved: returns.filter((item) => item.status === "resolved").length,
      totalRefund: active.reduce((sum, item) => sum + Number(item.refund_amount || 0), 0),
    };
  }, [returns]);

  const selectedLines = lineDrafts.filter((line) => line.selected);
  const calculatedTotalRefund = selectedLines.reduce(
    (sum, line) => sum + Number(line.refund_amount || 0),
    0
  );

  const formatPKR = (amount: number) =>
    Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const updateLineDraft = (orderItemId: string, patch: Partial<ReturnLineDraft>) => {
    setLineDrafts((prev) =>
      prev.map((line) => {
        if (line.order_item_id !== orderItemId) return line;
        const updated = { ...line, ...patch };
        // If quantity changed, update refund amount proportionally if not manually altered
        if (patch.quantity !== undefined) {
          updated.refund_amount = Number(patch.quantity) * updated.unit_price;
        }
        return updated;
      })
    );
  };

  const getOrderItem = (orderItemId: string): OrderItem | undefined =>
    loadedOrder?.items?.find((item) => item.id === orderItemId);

  const handleCreateCase = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!loadedOrder) {
      toast.warning("Load an order before creating a case.");
      return;
    }
    if (!caseReason.trim()) {
      toast.warning("Add a return or exchange reason.");
      return;
    }
    if (selectedLines.length === 0) {
      toast.warning("Select at least one order item to return.");
      return;
    }

    const invalidLine = selectedLines.find((line) => {
      const item = getOrderItem(line.order_item_id);
      return !item || line.quantity < 1 || line.quantity > item.quantity;
    });

    if (invalidLine) {
      toast.warning("Return quantity cannot exceed purchased quantity.");
      return;
    }

    setSaving(true);
    try {
      const customerName =
        `${loadedOrder.shipping_address?.first_name || ""} ${loadedOrder.shipping_address?.last_name || ""}`.trim() || "Customer";

      const res = await createReturnCase({
        order_id: loadedOrder.id,
        request_type: requestType,
        customer_name: customerName,
        customer_phone: loadedOrder.contact_phone,
        customer_email: loadedOrder.contact_email,
        reason: caseReason.trim(),
        admin_notes: caseNotes.trim() || null,
        items: selectedLines.map((line) => {
          const item = getOrderItem(line.order_item_id);
          return {
            order_item_id: line.order_item_id,
            product_id: item?.product_id || null,
            variant_id: item?.variant_id || null,
            quantity: line.quantity,
            reason: line.reason.trim() || caseReason.trim(),
            condition_status: line.condition_status,
            restock_action: line.restock_action,
            refund_amount: Number(line.refund_amount || 0),
          };
        }),
      });

      if (!res.success || !res.returnId) {
        throw new Error(res.error || "Failed to create return case.");
      }

      toast.success("Return / exchange case created successfully!");
      setShowCreateModal(false);
      setLoadedOrder(null);
      setLineDrafts([]);
      setCaseReason("");
      setCaseNotes("");
      setOrderIdInput("");
      await fetchReturns();
      router.push(`/admin/returns/${res.returnId}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create return case.");
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadgeClass = (status: ReturnRequestStatus) => {
    if (status === "resolved") return styles.badgeDelivered;
    if (["approved", "received", "inspected"].includes(status)) return styles.badgeShipped;
    if (status === "requested") return styles.badgePending;
    if (["rejected", "cancelled"].includes(status)) return styles.badgeCancelled;
    return styles.badgeProcessing;
  };

  const getTypeBadgeStyle = (type: ReturnRequestType) => {
    switch (type) {
      case "exchange":
        return { backgroundColor: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", border: "1px solid rgba(59, 130, 246, 0.3)" };
      case "replacement":
        return { backgroundColor: "rgba(236, 72, 153, 0.15)", color: "#f472b6", border: "1px solid rgba(236, 72, 153, 0.3)" };
      default:
        return { backgroundColor: "rgba(233, 195, 73, 0.15)", color: "#e9c349", border: "1px solid rgba(233, 195, 73, 0.3)" };
    }
  };

  return (
    <div className={styles.pageLayout}>
      {/* Header & Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <div>
          <h1 className={styles.pageTitle} style={{ margin: 0 }}>Returns & Exchanges Hub</h1>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--admin-text-sub)" }}>
            Manage customer return requests, reverse courier logistics, warehouse QC, restock flows, and refunds.
          </p>
        </div>
        <Button
          type="button"
          variant="luxury"
          size="md"
          onClick={() => setShowCreateModal(true)}
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <span>＋</span> New Return / Exchange
        </Button>
      </div>

      {/* KPI Dashboard */}
      <div className={styles.dashboardGrid}>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Total Cases</span>
          <h3 className={styles.cardValue}>{metrics.total}</h3>
        </div>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Needs Review</span>
          <h3 className={styles.cardValue} style={{ color: "#fbbf24" }}>{metrics.requested}</h3>
        </div>
        <div className={styles.card}>
          <span className={styles.cardLabel}>In Reverse Transit</span>
          <h3 className={styles.cardValue} style={{ color: "#60a5fa" }}>{metrics.inTransit}</h3>
        </div>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Warehouse QC</span>
          <h3 className={styles.cardValue} style={{ color: "#a78bfa" }}>{metrics.qcPending}</h3>
        </div>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Resolved</span>
          <h3 className={styles.cardValue} style={{ color: "#4ade80" }}>{metrics.resolved}</h3>
        </div>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Total Value Refunded</span>
          <h3 className={styles.cardValue}>{formatPKR(metrics.totalRefund)}</h3>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className={styles.formCard} style={{ padding: "16px 20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "12px", marginBottom: "16px" }}>
          {TAB_FILTERS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "6px 14px",
                borderRadius: "var(--radius-sm, 6px)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                border: activeTab === tab.key ? "1px solid var(--color-gold)" : "1px solid transparent",
                backgroundColor: activeTab === tab.key ? "rgba(233, 195, 73, 0.12)" : "transparent",
                color: activeTab === tab.key ? "var(--color-gold)" : "var(--admin-text-sub)",
                transition: "all 0.2s ease",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flexGrow: 1, minWidth: "260px" }}>
            <input
              type="text"
              placeholder="Search by Case ID, Order ID, Customer, Phone, or Tracking #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.formInput}
              style={{ margin: 0, padding: "8px 12px", fontSize: "13px" }}
            />
          </div>

          <div style={{ width: "160px" }}>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ReturnRequestType | "all")}
              className={styles.formSelect}
              style={{ margin: 0, padding: "8px 12px", fontSize: "13px" }}
            >
              <option value="all">All Request Types</option>
              <option value="return">Return only</option>
              <option value="exchange">Exchange only</option>
              <option value="replacement">Replacement only</option>
            </select>
          </div>

          {(searchTerm || typeFilter !== "all" || activeTab !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setTypeFilter("all");
                setActiveTab("all");
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--admin-text-sub)",
                fontSize: "12px",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Cases Table */}
      <div className={styles.formCard} style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <p className="font-body text-sm text-admin-text-sub text-center py-12">Loading return requests...</p>
        ) : filteredReturns.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>📦</div>
            <h4 style={{ margin: "0 0 6px", fontSize: "15px", color: "var(--admin-text)" }}>No return cases found</h4>
            <p style={{ margin: "0 0 16px", fontSize: "13px", color: "var(--admin-text-sub)" }}>
              {searchTerm || activeTab !== "all"
                ? "Try adjusting your search criteria or tab filters."
                : "No customer return or exchange requests currently recorded."}
            </p>
            <Button variant="outline" size="sm" onClick={() => setShowCreateModal(true)}>
              Create First Return Case
            </Button>
          </div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.tableTh}>Case / Type</th>
                  <th className={styles.tableTh}>Order ID</th>
                  <th className={styles.tableTh}>Customer</th>
                  <th className={styles.tableTh}>Status</th>
                  <th className={styles.tableTh}>Items</th>
                  <th className={styles.tableTh}>Resolution / Refund</th>
                  <th className={styles.tableTh}>Reverse Courier</th>
                  <th className={styles.tableTh}>Requested Date</th>
                  <th className={styles.tableTh} style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReturns.map((item) => (
                  <tr key={item.id} className={styles.tableTr}>
                    <td className={styles.tableTd}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontFamily: "monospace", fontSize: "12px", fontWeight: 700, color: "var(--admin-text)" }}>
                          #{item.id.slice(0, 8)}
                        </span>
                        <span
                          style={{
                            fontSize: "10px",
                            textTransform: "uppercase",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontWeight: 700,
                            letterSpacing: "0.5px",
                            ...getTypeBadgeStyle(item.request_type),
                          }}
                        >
                          {item.request_type}
                        </span>
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--admin-text-sub)", marginTop: "2px", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.reason}
                      </div>
                    </td>

                    <td className={styles.tableTd}>
                      <div style={{ display: "inline-flex", alignItems: "center" }}>
                        <Link href={`/admin/orders/${item.order_id}`} className={styles.tableLink}>
                          {item.order_id}
                        </Link>
                        <CopyButton text={item.order_id} />
                      </div>
                    </td>

                    <td className={styles.tableTd}>
                      <div style={{ fontWeight: 600, color: "var(--admin-text)" }}>{item.customer_name}</div>
                      <div style={{ fontSize: "11px", color: "var(--admin-text-sub)" }}>{item.customer_phone}</div>
                    </td>

                    <td className={styles.tableTd}>
                      <span className={`${styles.badge} ${getStatusBadgeClass(item.status)}`}>
                        {item.status}
                      </span>
                    </td>

                    <td className={styles.tableTd}>
                      <span style={{ fontSize: "12px", fontWeight: 600 }}>
                        {item.items?.length || 1} {item.items?.length === 1 ? "item" : "items"}
                      </span>
                    </td>

                    <td className={styles.tableTd}>
                      {item.request_type === "exchange" ? (
                        <div>
                          <span style={{ fontSize: "11px", color: "#60a5fa", fontWeight: 600 }}>
                            {item.exchange_order_id ? `Exchange: #${item.exchange_order_id}` : "Exchange pending"}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className={styles.tableTdHighlight}>
                            {formatPKR(Number(item.refund_amount || 0))}
                          </span>
                          {item.resolution_type && (
                            <div style={{ fontSize: "10px", color: "var(--admin-text-sub)", textTransform: "capitalize" }}>
                              {item.resolution_type.replace("_", " ")}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    <td className={styles.tableTd}>
                      {item.reverse_courier_name || item.reverse_tracking_number ? (
                        <div>
                          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--admin-text)" }}>
                            {item.reverse_courier_name || "Courier"}
                          </div>
                          {item.reverse_tracking_url ? (
                            <a
                              href={item.reverse_tracking_url}
                              target="_blank"
                              rel="noreferrer"
                              className={styles.tableLink}
                              style={{ fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "3px" }}
                            >
                              {item.reverse_tracking_number || "Track"} ↗
                            </a>
                          ) : (
                            <span style={{ fontSize: "11px", color: "var(--admin-text-sub)", fontFamily: "monospace" }}>
                              {item.reverse_tracking_number}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: "11px", color: "var(--admin-text-sub)" }}>Not booked</span>
                      )}
                    </td>

                    <td className={styles.tableTd} style={{ fontSize: "12px", color: "var(--admin-text-sub)" }}>
                      {formatDate(item.requested_at || item.created_at)}
                    </td>

                    <td className={styles.tableTd} style={{ textAlign: "right" }}>
                      <Link
                        href={`/admin/returns/${item.id}`}
                        style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          backgroundColor: "rgba(233, 195, 73, 0.1)",
                          color: "var(--color-gold)",
                          border: "1px solid rgba(233, 195, 73, 0.3)",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: 600,
                          textDecoration: "none",
                          transition: "all 0.2s ease",
                        }}
                      >
                        Manage →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE RETURN / EXCHANGE MODAL */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              backgroundColor: "#161515",
              border: "1px solid var(--admin-border)",
              borderRadius: "var(--radius-md, 8px)",
              width: "100%",
              maxWidth: "840px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "28px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "14px" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--color-gold)", letterSpacing: "0.5px" }}>
                  Create Return / Exchange Case
                </h2>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--admin-text-sub)" }}>
                  Initiate a formal return, size exchange, or defect replacement for an existing customer order.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--admin-text-sub)",
                  fontSize: "20px",
                  cursor: "pointer",
                  lineHeight: 1,
                  padding: "4px 8px",
                }}
              >
                ✕
              </button>
            </div>

            {/* Step 1: Order Lookup */}
            <div style={{ marginBottom: "20px" }}>
              <label className={styles.formLabel}>Find Order by ID</label>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="text"
                  placeholder="e.g. AYR-12345 or full order UUID"
                  value={orderIdInput}
                  onChange={(e) => setOrderIdInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), loadOrder())}
                  className={styles.formInput}
                  style={{ margin: 0, flexGrow: 1 }}
                />
                <Button type="button" variant="luxury" size="sm" onClick={() => loadOrder()} isLoading={loadingOrder}>
                  Fetch Order
                </Button>
              </div>
            </div>

            {/* Step 2: Loaded Order Summary */}
            {loadedOrder && (
              <div style={{ marginBottom: "24px" }}>
                {/* Warning if order already has returns */}
                {existingOrderReturns.length > 0 && (
                  <div
                    style={{
                      backgroundColor: "rgba(251, 191, 36, 0.1)",
                      border: "1px solid rgba(251, 191, 36, 0.3)",
                      borderRadius: "6px",
                      padding: "10px 14px",
                      marginBottom: "16px",
                      fontSize: "12px",
                      color: "#fbbf24",
                    }}
                  >
                    ⚠️ <strong>Note:</strong> This order already has {existingOrderReturns.length} existing return case(s):{" "}
                    {existingOrderReturns.map((r) => `#${r.id.slice(0, 8)} (${r.status})`).join(", ")}.
                  </div>
                )}

                <div
                  style={{
                    backgroundColor: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "6px",
                    padding: "12px 16px",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: "12px",
                    fontSize: "12px",
                    marginBottom: "20px",
                  }}
                >
                  <div>
                    <span style={{ color: "var(--admin-text-sub)" }}>Customer:</span>
                    <div style={{ fontWeight: 600, color: "var(--admin-text)" }}>
                      {loadedOrder.shipping_address?.first_name} {loadedOrder.shipping_address?.last_name}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: "var(--admin-text-sub)" }}>Phone:</span>
                    <div style={{ fontWeight: 600, color: "var(--admin-text)" }}>{loadedOrder.contact_phone}</div>
                  </div>
                  <div>
                    <span style={{ color: "var(--admin-text-sub)" }}>City:</span>
                    <div style={{ fontWeight: 600, color: "var(--admin-text)" }}>{loadedOrder.city}</div>
                  </div>
                  <div>
                    <span style={{ color: "var(--admin-text-sub)" }}>Order Total:</span>
                    <div style={{ fontWeight: 600, color: "var(--color-gold)" }}>{formatPKR(loadedOrder.total)}</div>
                  </div>
                </div>

                <form onSubmit={handleCreateCase}>
                  {/* Case Type & Reason */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "16px", marginBottom: "16px" }}>
                    <div className={styles.formGroup} style={{ margin: 0 }}>
                      <label className={styles.formLabel}>Request Type</label>
                      <select
                        value={requestType}
                        onChange={(e) => setRequestType(e.target.value as ReturnRequestType)}
                        className={styles.formSelect}
                      >
                        <option value="return">Return for Refund / Credit</option>
                        <option value="exchange">Size / Product Exchange</option>
                        <option value="replacement">Defect Replacement</option>
                      </select>
                    </div>

                    <div className={styles.formGroup} style={{ margin: 0 }}>
                      <label className={styles.formLabel}>Primary Reason *</label>
                      <input
                        type="text"
                        placeholder="e.g. Size too small, fabric defect, changed mind, wrong color"
                        value={caseReason}
                        onChange={(e) => setCaseReason(e.target.value)}
                        className={styles.formInput}
                        required
                      />
                    </div>
                  </div>

                  {/* Items Selection Table */}
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <label className={styles.formLabel} style={{ margin: 0 }}>Select Items to Return / Exchange</label>
                      <span style={{ fontSize: "11px", color: "var(--admin-text-sub)" }}>
                        {selectedLines.length} of {lineDrafts.length} item(s) selected
                      </span>
                    </div>

                    <div className={styles.tableResponsive} style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px" }}>
                      <table className={styles.table} style={{ margin: 0 }}>
                        <thead>
                          <tr>
                            <th className={styles.tableTh} style={{ width: "40px" }}></th>
                            <th className={styles.tableTh}>Product</th>
                            <th className={styles.tableTh} style={{ width: "90px" }}>Return Qty</th>
                            <th className={styles.tableTh} style={{ width: "130px" }}>Condition</th>
                            <th className={styles.tableTh} style={{ width: "130px" }}>Restock Plan</th>
                            {requestType !== "exchange" && (
                              <th className={styles.tableTh} style={{ width: "120px" }}>Refund (PKR)</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {lineDrafts.map((line) => (
                            <tr key={line.order_item_id} className={styles.tableTr} style={{ opacity: line.selected ? 1 : 0.4 }}>
                              <td className={styles.tableTd}>
                                <input
                                  type="checkbox"
                                  checked={line.selected}
                                  onChange={(e) => updateLineDraft(line.order_item_id, { selected: e.target.checked })}
                                  style={{ cursor: "pointer" }}
                                />
                              </td>

                              <td className={styles.tableTd}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                  {line.image_url ? (
                                    <Image
                                      src={line.image_url}
                                      alt={line.product_name}
                                      width={36}
                                      height={36}
                                      style={{ objectFit: "cover", borderRadius: "4px" }}
                                    />
                                  ) : (
                                    <div style={{ width: 36, height: 36, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "4px" }} />
                                  )}
                                  <div>
                                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--admin-text)" }}>
                                      {line.product_name}
                                    </div>
                                    {line.variant_size && (
                                      <span style={{ fontSize: "11px", color: "var(--color-gold)" }}>Size: {line.variant_size}</span>
                                    )}
                                    <span style={{ fontSize: "11px", color: "var(--admin-text-sub)", marginLeft: "6px" }}>
                                      (Purchased: {line.max_quantity})
                                    </span>
                                  </div>
                                </div>
                              </td>

                              <td className={styles.tableTd}>
                                <input
                                  type="number"
                                  min={1}
                                  max={line.max_quantity}
                                  value={line.quantity}
                                  disabled={!line.selected}
                                  onChange={(e) =>
                                    updateLineDraft(line.order_item_id, {
                                      quantity: Math.min(line.max_quantity, Math.max(1, Number(e.target.value))),
                                    })
                                  }
                                  className={styles.formInput}
                                  style={{ margin: 0, padding: "4px 8px", fontSize: "12px", width: "65px" }}
                                />
                              </td>

                              <td className={styles.tableTd}>
                                <select
                                  value={line.condition_status}
                                  disabled={!line.selected}
                                  onChange={(e) => updateLineDraft(line.order_item_id, { condition_status: e.target.value as ReturnConditionStatus })}
                                  className={styles.formSelect}
                                  style={{ margin: 0, padding: "4px 8px", fontSize: "11px" }}
                                >
                                  <option value="unopened">Unopened</option>
                                  <option value="unused">Unused</option>
                                  <option value="used">Used</option>
                                  <option value="damaged">Damaged</option>
                                  <option value="wrong_item">Wrong Item</option>
                                  <option value="defective">Defective</option>
                                </select>
                              </td>

                              <td className={styles.tableTd}>
                                <select
                                  value={line.restock_action}
                                  disabled={!line.selected}
                                  onChange={(e) => updateLineDraft(line.order_item_id, { restock_action: e.target.value as ReturnRestockAction })}
                                  className={styles.formSelect}
                                  style={{ margin: 0, padding: "4px 8px", fontSize: "11px" }}
                                >
                                  <option value="inspect_later">Inspect later</option>
                                  <option value="restock">Restock</option>
                                  <option value="do_not_restock">Do not restock</option>
                                </select>
                              </td>

                              {requestType !== "exchange" && (
                                <td className={styles.tableTd}>
                                  <input
                                    type="number"
                                    min={0}
                                    value={line.refund_amount}
                                    disabled={!line.selected}
                                    onChange={(e) => updateLineDraft(line.order_item_id, { refund_amount: Number(e.target.value) })}
                                    className={styles.formInput}
                                    style={{ margin: 0, padding: "4px 8px", fontSize: "12px", width: "100px" }}
                                  />
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Refund summary banner */}
                  {requestType !== "exchange" && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        backgroundColor: "rgba(233, 195, 73, 0.08)",
                        border: "1px solid rgba(233, 195, 73, 0.2)",
                        borderRadius: "6px",
                        padding: "10px 16px",
                        marginBottom: "16px",
                      }}
                    >
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-gold)" }}>
                        Calculated Refund Total:
                      </span>
                      <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-gold)" }}>
                        {formatPKR(calculatedTotalRefund)}
                      </span>
                    </div>
                  )}

                  {/* Internal Admin Notes */}
                  <div className={styles.formGroup} style={{ marginBottom: "20px" }}>
                    <label className={styles.formLabel}>Internal Admin Notes (Optional)</label>
                    <textarea
                      placeholder="Notes regarding customer conversation, warehouse handling, or replacement instructions..."
                      value={caseNotes}
                      onChange={(e) => setCaseNotes(e.target.value)}
                      className={styles.formTextarea}
                      rows={2}
                    />
                  </div>

                  {/* Modal Action Buttons */}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                    <Button type="button" variant="outline" size="md" onClick={() => setShowCreateModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="luxury" size="md" isLoading={saving}>
                      Confirm & Create Case
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
