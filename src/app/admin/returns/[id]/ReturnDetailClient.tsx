"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/context/ToastContext";
import {
  OrderReturnItem,
  OrderReturnRequest,
  ReturnResolutionType,
  ReturnRequestStatus,
  ReturnConditionStatus,
  ReturnRestockAction,
} from "@/types";
import { Button } from "@/components/storefront/Button/Button";
import {
  restockReturnItems,
  updateReturnItem,
  batchUpdateReturnItems,
} from "@/app/actions/returns";
import styles from "../../admin.module.css";

interface ReturnDetailClientProps {
  returnId: string;
}

const STATUS_OPTIONS: ReturnRequestStatus[] = [
  "draft",
  "requested",
  "approved",
  "rejected",
  "received",
  "inspected",
  "resolved",
  "cancelled",
];

const RESOLUTION_OPTIONS: Array<ReturnResolutionType | ""> = [
  "",
  "refund",
  "exchange_order",
  "store_credit",
  "no_action",
];

export const ReturnDetailClient: React.FC<ReturnDetailClientProps> = ({ returnId }) => {
  const supabase = createClient();
  const toast = useToast();
  const [request, setRequest] = useState<OrderReturnRequest | null>(null);
  const [items, setItems] = useState<OrderReturnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restocking, setRestocking] = useState(false);

  const [status, setStatus] = useState<ReturnRequestStatus>("requested");
  const [resolutionType, setResolutionType] = useState<ReturnResolutionType | "">("");
  const [refundAmount, setRefundAmount] = useState(0);
  const [storeCreditAmount, setStoreCreditAmount] = useState(0);
  const [exchangeOrderId, setExchangeOrderId] = useState("");
  const [reverseCourierName, setReverseCourierName] = useState("");
  const [reverseTrackingNumber, setReverseTrackingNumber] = useState("");
  const [reverseTrackingUrl, setReverseTrackingUrl] = useState("");
  const [conditionNotes, setConditionNotes] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    fetchReturn();
  }, [returnId]);

  async function fetchReturn() {
    try {
      const { data, error } = await supabase
        .from("order_return_requests")
        .select("*, order:orders!order_return_requests_order_id_fkey(*)")
        .eq("id", returnId)
        .single();

      if (error || !data) {
        toast.error("Return case not found.");
        setRequest(null);
        return;
      }

      const caseData = data as OrderReturnRequest;
      setRequest(caseData);
      setStatus(caseData.status);
      setResolutionType(caseData.resolution_type || "");
      setRefundAmount(Number(caseData.refund_amount || 0));
      setStoreCreditAmount(Number(caseData.store_credit_amount || 0));
      setExchangeOrderId(caseData.exchange_order_id || "");
      setReverseCourierName(caseData.reverse_courier_name || "");
      setReverseTrackingNumber(caseData.reverse_tracking_number || "");
      setReverseTrackingUrl(caseData.reverse_tracking_url || "");
      setConditionNotes(caseData.condition_notes || "");
      setAdminNotes(caseData.admin_notes || "");

      const { data: itemData } = await supabase
        .from("order_return_items")
        .select("*, product:products!order_return_items_product_id_fkey(*), variant:product_variants!order_return_items_variant_id_fkey(*), order_item:order_items(*), exchange_product:products!order_return_items_exchange_product_id_fkey(*), exchange_variant:product_variants!order_return_items_exchange_variant_id_fkey(*)")
        .eq("return_request_id", returnId)
        .order("created_at", { ascending: true });

      setItems((itemData || []) as OrderReturnItem[]);
    } catch (err) {
      console.error("Failed to load return detail:", err);
      toast.error("Failed to load return detail.");
    } finally {
      setLoading(false);
    }
  }

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
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalItemRefund = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.refund_amount || 0), 0),
    [items]
  );

  const getStatusBadgeClass = (value: ReturnRequestStatus) => {
    if (value === "resolved") return styles.badgeDelivered;
    if (["approved", "received", "inspected"].includes(value)) return styles.badgeShipped;
    if (value === "requested") return styles.badgePending;
    if (["rejected", "cancelled"].includes(value)) return styles.badgeCancelled;
    return styles.badgeProcessing;
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!request) return;

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const patch: Record<string, any> = {
        status,
        resolution_type: resolutionType || null,
        refund_amount: refundAmount,
        store_credit_amount: storeCreditAmount,
        exchange_order_id: exchangeOrderId.trim() || null,
        reverse_courier_name: reverseCourierName.trim() || null,
        reverse_tracking_number: reverseTrackingNumber.trim() || null,
        reverse_tracking_url: reverseTrackingUrl.trim() || null,
        condition_notes: conditionNotes.trim() || null,
        admin_notes: adminNotes.trim() || null,
        updated_at: now,
      };

      if (status === "approved" && !request.approved_at) patch.approved_at = now;
      if (status === "received" && !request.received_at) patch.received_at = now;
      if (status === "resolved" && !request.resolved_at) patch.resolved_at = now;

      const { error } = await supabase
        .from("order_return_requests")
        .update(patch)
        .eq("id", request.id);

      if (error) throw new Error(error.message);

      toast.success("Return case updated.");
      await fetchReturn();
    } catch (err: any) {
      toast.error(err.message || "Failed to update return case.");
    } finally {
      setSaving(false);
    }
  };

  const handleItemRestockActionChange = async (itemId: string, action: ReturnRestockAction) => {
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, restock_action: action } : it))
    );
    const res = await updateReturnItem(itemId, { restock_action: action });
    if (!res.success) {
      toast.error(res.error || "Failed to update item restock action.");
    } else {
      toast.success(`Restock action set to "${action}".`);
    }
  };

  const handleItemConditionChange = async (itemId: string, condition: ReturnConditionStatus) => {
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, condition_status: condition } : it))
    );
    const res = await updateReturnItem(itemId, { condition_status: condition });
    if (!res.success) {
      toast.error(res.error || "Failed to update item condition.");
    }
  };

  const handleBatchRestockAction = async (action: ReturnRestockAction) => {
    setItems((prev) => prev.map((it) => ({ ...it, restock_action: action })));
    const res = await batchUpdateReturnItems(returnId, action);
    if (!res.success) {
      toast.error(res.error || "Failed to batch update items.");
    } else {
      toast.success(`All items set to "${action}".`);
    }
  };

  const handleRestock = async () => {
    const restockable = items.filter((item) => item.restock_action === "restock" && item.variant_id);
    if (restockable.length === 0) {
      toast.warning(
        "No variant items are currently marked for restock. Select 'Restock' in the item dropdown or click 'Mark All for Restock'."
      );
      return;
    }

    setRestocking(true);
    try {
      const res = await restockReturnItems(returnId);
      if (!res.success) {
        throw new Error(res.error || "Failed to restock items.");
      }

      toast.success(`Successfully restocked ${res.restockedCount} item(s) to store inventory!`);
      await fetchReturn();
    } catch (err: any) {
      toast.error(err.message || "Failed to restock items.");
    } finally {
      setRestocking(false);
    }
  };

  if (loading) {
    return <p className="font-body text-sm text-admin-text-sub text-center py-12">Loading return case...</p>;
  }

  if (!request) {
    return <p className="font-body text-sm text-error text-center py-12">Return case not found.</p>;
  }

  return (
    <div className={styles.pageLayout}>
      <div>
        <Link href="/admin/returns" className={styles.backLink}>
          &larr; Back to Returns
        </Link>
      </div>

      <div className={styles.dashboardGrid}>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Case Type</span>
          <h3 className={styles.cardValue}>{request.request_type}</h3>
        </div>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Current Status</span>
          <h3 className={styles.cardValue}>
            <span className={`${styles.badge} ${getStatusBadgeClass(request.status)}`}>{request.status}</span>
          </h3>
        </div>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Item Refund Total</span>
          <h3 className={styles.cardValue}>{formatPKR(totalItemRefund)}</h3>
        </div>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Order</span>
          <h3 className={styles.cardValue}>
            <Link href={`/admin/orders/${request.order_id}`} className={styles.tableLink}>{request.order_id}</Link>
          </h3>
        </div>
      </div>

      <div className={styles.twoColLayout}>
        <div className={styles.mainFormCol}>
          <div className={styles.formCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 className={styles.formCardTitle} style={{ margin: 0 }}>Returned Items</h3>
              <div style={{ display: "flex", gap: "8px" }}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleBatchRestockAction("restock")}
                  style={{ fontSize: "11px", padding: "4px 8px" }}
                >
                  Mark All Restock
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleBatchRestockAction("do_not_restock")}
                  style={{ fontSize: "11px", padding: "4px 8px" }}
                >
                  Mark All Do Not Restock
                </Button>
              </div>
            </div>

            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.tableTh}>Product</th>
                    <th className={styles.tableTh}>Qty</th>
                    <th className={styles.tableTh}>Condition</th>
                    <th className={styles.tableTh}>Restock Action</th>
                    <th className={styles.tableTh}>Refund</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className={styles.tableTr}>
                      <td className={styles.tableTd}>
                        <span className={styles.tableTdHighlight}>{item.product?.name || item.product_id || "Product"}</span>
                        {item.variant?.size && (
                          <div style={{ fontSize: "11px", color: "var(--admin-text-sub)" }}>Size: {item.variant.size}</div>
                        )}
                      </td>
                      <td className={styles.tableTd}>{item.quantity}</td>
                      <td className={styles.tableTd}>
                        <select
                          value={item.condition_status || "unopened"}
                          onChange={(e) => handleItemConditionChange(item.id, e.target.value as ReturnConditionStatus)}
                          className={styles.formSelect}
                          style={{ padding: "4px 8px", fontSize: "12px", minWidth: "110px" }}
                        >
                          <option value="unopened">Unopened</option>
                          <option value="unused">Unused</option>
                          <option value="used">Used</option>
                          <option value="damaged">Damaged</option>
                          <option value="wrong_item">Wrong item</option>
                          <option value="defective">Defective</option>
                        </select>
                      </td>
                      <td className={styles.tableTd}>
                        <select
                          value={item.restock_action || "inspect_later"}
                          onChange={(e) => handleItemRestockActionChange(item.id, e.target.value as ReturnRestockAction)}
                          className={styles.formSelect}
                          style={{
                            padding: "4px 8px",
                            fontSize: "12px",
                            minWidth: "125px",
                            borderColor: item.restock_action === "restock" ? "#10b981" : undefined,
                            color: item.restock_action === "restock" ? "#10b981" : undefined,
                            fontWeight: item.restock_action === "restock" ? 600 : 400,
                          }}
                        >
                          <option value="inspect_later">Inspect later</option>
                          <option value="restock">Restock</option>
                          <option value="do_not_restock">Do not restock</option>
                        </select>
                      </td>
                      <td className={`${styles.tableTd} ${styles.tableTdHighlight}`}>{formatPKR(Number(item.refund_amount || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
              <Button type="button" variant="luxury" size="sm" onClick={handleRestock} isLoading={restocking}>
                Restock Marked Items ({items.filter((i) => i.restock_action === "restock" && i.variant_id).length})
              </Button>
              <span style={{ fontSize: "12px", color: "var(--admin-text-sub)" }}>
                {items.filter((i) => i.restock_action === "restock" && i.variant_id).length} of {items.length} item(s) ready to return to store stock.
              </span>
            </div>
          </div>

          <form onSubmit={handleSave} className={styles.formCard}>
            <h3 className={styles.formCardTitle}>Case Management</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Status</label>
                <select value={status} onChange={(event) => setStatus(event.target.value as ReturnRequestStatus)} className={styles.formSelect}>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Resolution</label>
                <select value={resolutionType} onChange={(event) => setResolutionType(event.target.value as ReturnResolutionType | "")} className={styles.formSelect}>
                  {RESOLUTION_OPTIONS.map((option) => (
                    <option key={option || "none"} value={option}>{option || "Not selected"}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Refund Amount</label>
                <input type="number" min={0} value={refundAmount} onChange={(event) => setRefundAmount(Number(event.target.value))} className={styles.formInput} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Store Credit</label>
                <input type="number" min={0} value={storeCreditAmount} onChange={(event) => setStoreCreditAmount(Number(event.target.value))} className={styles.formInput} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Exchange Order ID</label>
                <input value={exchangeOrderId} onChange={(event) => setExchangeOrderId(event.target.value)} className={styles.formInput} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Reverse Courier</label>
                <input value={reverseCourierName} onChange={(event) => setReverseCourierName(event.target.value)} className={styles.formInput} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Reverse Tracking Number</label>
                <input value={reverseTrackingNumber} onChange={(event) => setReverseTrackingNumber(event.target.value)} className={styles.formInput} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Reverse Tracking URL</label>
                <input value={reverseTrackingUrl} onChange={(event) => setReverseTrackingUrl(event.target.value)} className={styles.formInput} />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Condition Notes</label>
              <textarea value={conditionNotes} onChange={(event) => setConditionNotes(event.target.value)} className={styles.formTextarea} rows={3} />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Admin Notes</label>
              <textarea value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} className={styles.formTextarea} rows={4} />
            </div>

            <Button type="submit" variant="luxury" size="lg" isLoading={saving}>
              Save Case
            </Button>
          </form>
        </div>

        <div className={styles.sidebarFormCol}>
          <div className={styles.formCard}>
            <h3 className={styles.formCardTitle}>Customer</h3>
            <p className={styles.orderDetailText}><strong>Name:</strong> {request.customer_name}</p>
            <p className={styles.orderDetailText}><strong>Phone:</strong> {request.customer_phone}</p>
            <p className={styles.orderDetailText}><strong>Email:</strong> {request.customer_email || "-"}</p>
          </div>

          <div className={styles.formCard}>
            <h3 className={styles.formCardTitle}>Timeline</h3>
            <p className={styles.orderDetailText}><strong>Requested:</strong> {formatDate(request.requested_at)}</p>
            <p className={styles.orderDetailText}><strong>Approved:</strong> {formatDate(request.approved_at)}</p>
            <p className={styles.orderDetailText}><strong>Received:</strong> {formatDate(request.received_at)}</p>
            <p className={styles.orderDetailText}><strong>Resolved:</strong> {formatDate(request.resolved_at)}</p>
          </div>

          <div className={styles.formCard}>
            <h3 className={styles.formCardTitle}>Reason</h3>
            <p className={styles.orderDetailText}>{request.reason}</p>
            {request.reverse_tracking_url && (
              <Link href={request.reverse_tracking_url} className={styles.tableLink} target="_blank">
                Open reverse tracking
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
