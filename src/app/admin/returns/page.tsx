"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
import styles from "../admin.module.css";

type ReturnLineDraft = {
  order_item_id: string;
  selected: boolean;
  quantity: number;
  reason: string;
  condition_status: ReturnConditionStatus;
  restock_action: ReturnRestockAction;
  refund_amount: number;
};

const CASE_STATUSES: Array<ReturnRequestStatus | "all"> = [
  "all",
  "draft",
  "requested",
  "approved",
  "rejected",
  "received",
  "inspected",
  "resolved",
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

export default function AdminReturnsPage() {
  const router = useRouter();
  const supabase = createClient();
  const toast = useToast();

  const [returns, setReturns] = useState<OrderReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReturnRequestStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<ReturnRequestType | "all">("all");

  const [orderIdInput, setOrderIdInput] = useState("");
  const [loadedOrder, setLoadedOrder] = useState<Order | null>(null);
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
      loadOrder(initialOrderId);
    }
  }, []);

  async function fetchReturns() {
    try {
      const { data, error } = await supabase
        .from("order_return_requests")
        .select("*, order:orders!order_return_requests_order_id_fkey(*)")
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

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", targetOrderId)
      .single();

    if (orderError || !orderData) {
      toast.error("Order not found.");
      setLoadedOrder(null);
      setLineDrafts([]);
      return;
    }

    const { data: itemsData, error: itemsError } = await supabase
      .from("order_items")
      .select("*, product:products(*), variant:product_variants(*)")
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
      items.map((item) => ({
        order_item_id: item.id,
        selected: true,
        quantity: 1,
        reason: "",
        condition_status: "unused",
        restock_action: "inspect_later",
        refund_amount: Number(item.unit_price),
      }))
    );
  }

  const filteredReturns = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return returns.filter((item) => {
      const matchesSearch =
        item.id.toLowerCase().includes(term) ||
        item.order_id.toLowerCase().includes(term) ||
        item.customer_name.toLowerCase().includes(term) ||
        item.customer_phone.includes(searchTerm);
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesType = typeFilter === "all" || item.request_type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [returns, searchTerm, statusFilter, typeFilter]);

  const metrics = useMemo(() => {
    const active = returns.filter((item) => !["cancelled", "rejected"].includes(item.status));
    return {
      total: returns.length,
      pending: returns.filter((item) => ["requested", "approved", "received", "inspected"].includes(item.status)).length,
      resolved: returns.filter((item) => item.status === "resolved").length,
      refundValue: active.reduce((sum, item) => sum + Number(item.refund_amount || 0), 0),
    };
  }, [returns]);

  const selectedLines = lineDrafts.filter((line) => line.selected);

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
      prev.map((line) => (line.order_item_id === orderItemId ? { ...line, ...patch } : line))
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
      toast.warning("Select at least one order item.");
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const customerName = `${loadedOrder.shipping_address.first_name} ${loadedOrder.shipping_address.last_name}`.trim();
      const totalRefund = selectedLines.reduce((sum, line) => sum + Number(line.refund_amount || 0), 0);

      const { data: requestData, error: requestError } = await supabase
        .from("order_return_requests")
        .insert({
          order_id: loadedOrder.id,
          request_type: requestType,
          status: "requested",
          customer_name: customerName,
          customer_phone: loadedOrder.contact_phone,
          customer_email: loadedOrder.contact_email,
          reason: caseReason.trim(),
          admin_notes: caseNotes.trim() || null,
          refund_amount: requestType === "exchange" ? 0 : totalRefund,
          created_by: user?.id || null,
          updated_by: user?.id || null,
        })
        .select()
        .single();

      if (requestError || !requestData) {
        throw new Error(requestError?.message || "Failed to create return case.");
      }

      const returnItems = selectedLines.map((line) => {
        const item = getOrderItem(line.order_item_id);
        return {
          return_request_id: requestData.id,
          order_item_id: line.order_item_id,
          product_id: item?.product_id || null,
          variant_id: item?.variant_id || null,
          quantity: line.quantity,
          reason: line.reason.trim() || null,
          condition_status: line.condition_status,
          restock_action: line.restock_action,
          refund_amount: requestType === "exchange" ? 0 : Number(line.refund_amount || 0),
        };
      });

      const { error: itemsError } = await supabase.from("order_return_items").insert(returnItems);
      if (itemsError) {
        await supabase.from("order_return_requests").delete().eq("id", requestData.id);
        throw new Error(itemsError.message);
      }

      toast.success("Return / exchange case created.");
      setLoadedOrder(null);
      setLineDrafts([]);
      setCaseReason("");
      setCaseNotes("");
      setOrderIdInput("");
      await fetchReturns();
      router.push(`/admin/returns/${requestData.id}`);
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

  return (
    <div className={styles.pageLayout}>
      <div className={styles.dashboardGrid}>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Total Cases</span>
          <h3 className={styles.cardValue}>{metrics.total}</h3>
        </div>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Needs Action</span>
          <h3 className={styles.cardValue}>{metrics.pending}</h3>
        </div>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Resolved</span>
          <h3 className={styles.cardValue}>{metrics.resolved}</h3>
        </div>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Refund Liability</span>
          <h3 className={styles.cardValue}>{formatPKR(metrics.refundValue)}</h3>
        </div>
      </div>

      <form onSubmit={handleCreateCase} className={styles.formCard}>
        <h3 className={styles.formCardTitle}>Create Return / Exchange</h3>
        <div style={{ display: "grid", gridTemplateColumns: "2fr auto", gap: "12px", alignItems: "end" }}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Order ID</label>
            <input
              value={orderIdInput}
              onChange={(event) => setOrderIdInput(event.target.value)}
              className={styles.formInput}
              placeholder="AYR-00142"
            />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => loadOrder()}>
            Load Order
          </Button>
        </div>

        {loadedOrder && (
          <div style={{ display: "grid", gap: "18px", marginTop: "18px" }}>
            <div className={styles.tableCard} style={{ padding: "16px" }}>
              <strong>{loadedOrder.shipping_address.first_name} {loadedOrder.shipping_address.last_name}</strong>
              <p style={{ margin: "4px 0 0", color: "var(--admin-text-sub)", fontSize: "13px" }}>
                {loadedOrder.contact_phone} | {loadedOrder.city} | Order total {formatPKR(loadedOrder.total)}
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Case Type</label>
                <select value={requestType} onChange={(event) => setRequestType(event.target.value as ReturnRequestType)} className={styles.formSelect}>
                  <option value="return">Return</option>
                  <option value="exchange">Exchange</option>
                  <option value="replacement">Replacement</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Reason</label>
                <input value={caseReason} onChange={(event) => setCaseReason(event.target.value)} className={styles.formInput} required />
              </div>
            </div>

            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.tableTh}>Use</th>
                    <th className={styles.tableTh}>Item</th>
                    <th className={styles.tableTh}>Qty</th>
                    <th className={styles.tableTh}>Condition</th>
                    <th className={styles.tableTh}>Restock</th>
                    <th className={styles.tableTh}>Refund</th>
                  </tr>
                </thead>
                <tbody>
                  {lineDrafts.map((line) => {
                    const item = getOrderItem(line.order_item_id);
                    return (
                      <tr key={line.order_item_id} className={styles.tableTr}>
                        <td className={styles.tableTd}>
                          <input type="checkbox" checked={line.selected} onChange={(event) => updateLineDraft(line.order_item_id, { selected: event.target.checked })} />
                        </td>
                        <td className={styles.tableTd}>
                          <span className={styles.tableTdHighlight}>{item?.product_id || "Order item"}</span>
                          <div style={{ fontSize: "11px", color: "var(--admin-text-sub)" }}>Purchased qty: {item?.quantity || 0}</div>
                        </td>
                        <td className={styles.tableTd}>
                          <input
                            type="number"
                            min={1}
                            max={item?.quantity || 1}
                            value={line.quantity}
                            onChange={(event) => updateLineDraft(line.order_item_id, { quantity: Number(event.target.value) })}
                            className={styles.formInput}
                            style={{ width: "80px" }}
                          />
                        </td>
                        <td className={styles.tableTd}>
                          <select value={line.condition_status} onChange={(event) => updateLineDraft(line.order_item_id, { condition_status: event.target.value as ReturnConditionStatus })} className={styles.formSelect}>
                            <option value="unopened">Unopened</option>
                            <option value="unused">Unused</option>
                            <option value="used">Used</option>
                            <option value="damaged">Damaged</option>
                            <option value="wrong_item">Wrong item</option>
                            <option value="defective">Defective</option>
                          </select>
                        </td>
                        <td className={styles.tableTd}>
                          <select value={line.restock_action} onChange={(event) => updateLineDraft(line.order_item_id, { restock_action: event.target.value as ReturnRestockAction })} className={styles.formSelect}>
                            <option value="inspect_later">Inspect later</option>
                            <option value="restock">Restock</option>
                            <option value="do_not_restock">Do not restock</option>
                          </select>
                        </td>
                        <td className={styles.tableTd}>
                          <input
                            type="number"
                            min={0}
                            value={line.refund_amount}
                            disabled={requestType === "exchange"}
                            onChange={(event) => updateLineDraft(line.order_item_id, { refund_amount: Number(event.target.value) })}
                            className={styles.formInput}
                            style={{ width: "120px" }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Admin Notes</label>
              <textarea value={caseNotes} onChange={(event) => setCaseNotes(event.target.value)} className={styles.formTextarea} rows={3} />
            </div>

            <Button type="submit" variant="luxury" size="lg" isLoading={saving}>
              Create Case
            </Button>
          </div>
        )}
      </form>

      <div className={styles.filterContainer}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>Search</span>
          <input
            type="text"
            placeholder="Search by case, order, customer or phone..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filterWrapper}>
          <span className={styles.filterLabel}>Status:</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ReturnRequestStatus | "all")} className={styles.filterSelect}>
            {CASE_STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        <div className={styles.filterWrapper}>
          <span className={styles.filterLabel}>Type:</span>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as ReturnRequestType | "all")} className={styles.filterSelect}>
            <option value="all">all</option>
            <option value="return">return</option>
            <option value="exchange">exchange</option>
            <option value="replacement">replacement</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="font-body text-sm text-admin-text-sub text-center py-12">Loading return cases...</p>
      ) : filteredReturns.length === 0 ? (
        <div className={styles.tableCard} style={{ padding: "48px", textAlign: "center" }}>
          No return or exchange cases found.
        </div>
      ) : (
        <div className={styles.tableCard}>
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.tableTh}>Case</th>
                  <th className={styles.tableTh}>Order</th>
                  <th className={styles.tableTh}>Customer</th>
                  <th className={styles.tableTh}>Type</th>
                  <th className={styles.tableTh}>Status</th>
                  <th className={styles.tableTh}>Value</th>
                  <th className={styles.tableTh}>Date</th>
                  <th className={styles.tableTh}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReturns.map((item) => (
                  <tr key={item.id} className={styles.tableTr}>
                    <td className={`${styles.tableTd} ${styles.tableTdHighlight}`}>{item.id.slice(0, 8)}</td>
                    <td className={styles.tableTd} style={{ whiteSpace: "nowrap" }}>
                      <Link href={`/admin/orders/${item.order_id}`} className={styles.tableLink}>{item.order_id}</Link>
                      <CopyButton text={item.order_id} />
                    </td>
                    <td className={styles.tableTd}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span className={styles.tableTdHighlight}>{item.customer_name}</span>
                        <span style={{ fontSize: "11px", color: "var(--admin-text-sub)" }}>{item.customer_phone}</span>
                      </div>
                    </td>
                    <td className={styles.tableTd}>{item.request_type}</td>
                    <td className={styles.tableTd}>
                      <span className={`${styles.badge} ${getStatusBadgeClass(item.status)}`}>{item.status}</span>
                    </td>
                    <td className={`${styles.tableTd} ${styles.tableTdHighlight}`}>
                      {formatPKR(Number(item.refund_amount || item.store_credit_amount || 0))}
                    </td>
                    <td className={styles.tableTd}>{formatDate(item.created_at)}</td>
                    <td className={styles.tableTd}>
                      <Link href={`/admin/returns/${item.id}`} className={styles.tableLink}>Manage</Link>
                    </td>
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
