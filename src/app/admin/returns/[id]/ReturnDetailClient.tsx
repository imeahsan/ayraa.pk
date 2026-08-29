"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/context/ToastContext";
import {
  OrderReturnItem,
  OrderReturnRequest,
  Product,
  ProductVariant,
  ReturnConditionStatus,
  ReturnRequestStatus,
  ReturnRequestType,
  ReturnResolutionType,
  ReturnRestockAction,
} from "@/types";
import { Button } from "@/components/storefront/Button/Button";
import {
  batchUpdateReturnItems,
  createExchangeOrderAction,
  restockReturnItems,
  updateReturnCase,
  updateReturnItem,
} from "@/app/actions/returns";
import styles from "../../admin.module.css";

interface ReturnDetailClientProps {
  returnId: string;
}

const COURIER_PRESETS = [
  { name: "PostEx", urlTemplate: "https://postex.pk/tracking?tracking_number=" },
  { name: "Leopards Courier", urlTemplate: "https://www.leopardscourier.com/leopards-tracking?track=" },
  { name: "Trax Logistics", urlTemplate: "https://sonic.trax.pk/tracking?trackingNumber=" },
  { name: "Call Courier", urlTemplate: "https://callcourier.com.pk/tracking/?tc=" },
  { name: "TCS", urlTemplate: "https://www.tcsexpress.com/track/" },
];

const LIFECYCLE_STEPS: Array<{ key: ReturnRequestStatus; label: string; number: number }> = [
  { key: "requested", label: "1. Requested", number: 1 },
  { key: "approved", label: "2. Approved & AWB", number: 2 },
  { key: "received", label: "3. Received at Hub", number: 3 },
  { key: "inspected", label: "4. QC Inspected", number: 4 },
  { key: "resolved", label: "5. Resolved & Closed", number: 5 },
];

const RESOLUTION_OPTIONS: Array<{ value: ReturnResolutionType; label: string }> = [
  { value: "refund", label: "Refund (Original / Bank Transfer)" },
  { value: "exchange_order", label: "Exchange Replacement Order" },
  { value: "store_credit", label: "Store Credit Voucher" },
  { value: "no_action", label: "No Action / Rejected" },
];

export const ReturnDetailClient: React.FC<ReturnDetailClientProps> = ({ returnId }) => {
  const router = useRouter();
  const supabase = createClient();
  const toast = useToast();

  const [request, setRequest] = useState<OrderReturnRequest | null>(null);
  const [items, setItems] = useState<OrderReturnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restocking, setRestocking] = useState(false);

  // Form State
  const [status, setStatus] = useState<ReturnRequestStatus>("requested");
  const [requestType, setRequestType] = useState<ReturnRequestType>("return");
  const [resolutionType, setResolutionType] = useState<ReturnResolutionType | "">("");
  const [refundAmount, setRefundAmount] = useState(0);
  const [storeCreditAmount, setStoreCreditAmount] = useState(0);
  const [exchangeOrderId, setExchangeOrderId] = useState("");
  const [reverseCourierName, setReverseCourierName] = useState("");
  const [reverseTrackingNumber, setReverseTrackingNumber] = useState("");
  const [reverseTrackingUrl, setReverseTrackingUrl] = useState("");
  const [conditionNotes, setConditionNotes] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  // Exchange Order Generator Modal State
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [exchangeCatalog, setExchangeCatalog] = useState<Product[]>([]);
  const [selectedExchangeProduct, setSelectedExchangeProduct] = useState<Product | null>(null);
  const [selectedExchangeVariant, setSelectedExchangeVariant] = useState<ProductVariant | null>(null);
  const [exchangeQty, setExchangeQty] = useState(1);
  const [exchangeGenerating, setExchangeGenerating] = useState(false);

  // RMA Printable Modal State
  const [showRmaModal, setShowRmaModal] = useState(false);

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
      setRequestType(caseData.request_type);
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
        .select(`
          *,
          product:products!order_return_items_product_id_fkey (
            id, name, slug,
            images:product_images ( url, is_primary )
          ),
          variant:product_variants!order_return_items_variant_id_fkey ( id, size, color, stock_quantity ),
          order_item:order_items ( id, unit_price, quantity )
        `)
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

  // Load product catalog for exchange modal
  const openExchangeBuilder = async () => {
    setShowExchangeModal(true);
    if (exchangeCatalog.length === 0) {
      const { data } = await supabase
        .from("products")
        .select("*, variants:product_variants(*), images:product_images(*)")
        .eq("is_active", true)
        .order("name", { ascending: true });
      setExchangeCatalog((data || []) as Product[]);
    }
  };

  const handleCourierSelect = (courierName: string) => {
    setReverseCourierName(courierName);
    const preset = COURIER_PRESETS.find((c) => c.name === courierName);
    if (preset && reverseTrackingNumber) {
      setReverseTrackingUrl(`${preset.urlTemplate}${encodeURIComponent(reverseTrackingNumber.trim())}`);
    }
  };

  const handleTrackingNumberChange = (num: string) => {
    setReverseTrackingNumber(num);
    const preset = COURIER_PRESETS.find((c) => c.name === reverseCourierName);
    if (preset && num.trim()) {
      setReverseTrackingUrl(`${preset.urlTemplate}${encodeURIComponent(num.trim())}`);
    }
  };

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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalCalculatedRefund = useMemo(
    () => items.reduce((sum, it) => sum + Number(it.refund_amount || 0), 0),
    [items]
  );

  const restockStats = useMemo(() => {
    const isRestocked = (it: OrderReturnItem) => it.reason && it.reason.includes("[RESTOCKED:");
    const restockedCount = items.filter(isRestocked).length;
    const markedRestockCount = items.filter((it) => it.restock_action === "restock" && it.variant_id && !isRestocked(it)).length;
    const doNotRestockCount = items.filter((it) => it.restock_action === "do_not_restock").length;
    const inspectLaterCount = items.filter((it) => it.restock_action === "inspect_later").length;
    return {
      restockedCount,
      markedRestockCount,
      doNotRestockCount,
      inspectLaterCount,
    };
  }, [items]);

  const handleSaveForm = async (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    if (!request) return;

    setSaving(true);
    try {
      const res = await updateReturnCase({
        id: request.id,
        status,
        request_type: requestType,
        resolution_type: (resolutionType as ReturnResolutionType) || null,
        refund_amount: refundAmount,
        store_credit_amount: storeCreditAmount,
        exchange_order_id: exchangeOrderId,
        reverse_courier_name: reverseCourierName,
        reverse_tracking_number: reverseTrackingNumber,
        reverse_tracking_url: reverseTrackingUrl,
        condition_notes: conditionNotes,
        admin_notes: adminNotes,
      });

      if (!res.success) {
        throw new Error(res.error || "Failed to update return case.");
      }

      toast.success("Return case updated successfully.");
      await fetchReturn();
    } catch (err: any) {
      toast.error(err.message || "Failed to update return case.");
    } finally {
      setSaving(false);
    }
  };

  // Quick 1-Click Transition Handlers
  const handleAdvanceStatus = async (targetStatus: ReturnRequestStatus) => {
    if (!request) return;
    setStatus(targetStatus);

    setSaving(true);
    try {
      const res = await updateReturnCase({
        id: request.id,
        status: targetStatus,
      });

      if (!res.success) throw new Error(res.error);
      toast.success(`Case status advanced to "${targetStatus.toUpperCase()}".`);
      await fetchReturn();
    } catch (err: any) {
      toast.error(err.message || "Failed to advance case status.");
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

  const handleSafeRestock = async () => {
    if (restockStats.markedRestockCount === 0) {
      toast.warning(
        restockStats.restockedCount > 0
          ? "All marked items have already been restocked to inventory."
          : "No variant items are currently marked for restock. Set 'Restock' in item dropdowns."
      );
      return;
    }

    setRestocking(true);
    try {
      const res = await restockReturnItems(returnId);
      if (!res.success) {
        throw new Error(res.error || "Failed to restock items.");
      }

      if (res.alreadyRestocked) {
        toast.info(res.message || "All items were already restocked.");
      } else {
        toast.success(`Successfully restocked ${res.restockedCount} item(s) to store inventory!`);
      }
      await fetchReturn();
    } catch (err: any) {
      toast.error(err.message || "Failed to restock items.");
    } finally {
      setRestocking(false);
    }
  };

  const handleCreateExchangeOrder = async () => {
    if (!selectedExchangeProduct) {
      toast.warning("Please select a replacement product.");
      return;
    }

    setExchangeGenerating(true);
    try {
      const res = await createExchangeOrderAction(returnId, [
        {
          product_id: selectedExchangeProduct.id,
          variant_id: selectedExchangeVariant?.id || null,
          quantity: exchangeQty,
          unit_price: Number(selectedExchangeProduct.price || 0),
        },
      ]);

      if (!res.success || !res.exchangeOrderId) {
        throw new Error(res.error || "Failed to create exchange order.");
      }

      toast.success(`Exchange Order #${res.exchangeOrderId} generated and linked!`);
      setShowExchangeModal(false);
      await fetchReturn();
    } catch (err: any) {
      toast.error(err.message || "Failed to create exchange order.");
    } finally {
      setExchangeGenerating(false);
    }
  };

  if (loading) {
    return <p className="font-body text-sm text-admin-text-sub text-center py-12">Loading return case details...</p>;
  }

  if (!request) {
    return <p className="font-body text-sm text-error text-center py-12">Return case not found.</p>;
  }

  const getStepIndex = (st: ReturnRequestStatus) => {
    switch (st) {
      case "draft":
      case "requested":
        return 0;
      case "approved":
        return 1;
      case "received":
        return 2;
      case "inspected":
        return 3;
      case "resolved":
        return 4;
      default:
        return -1;
    }
  };

  const currentStepIdx = getStepIndex(request.status);

  return (
    <div className={styles.pageLayout}>
      {/* Top Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <Link href="/admin/returns" className={styles.backLink}>
          ← Back to Returns Hub
        </Link>
        <div style={{ display: "flex", gap: "10px" }}>
          <Button type="button" variant="outline" size="sm" onClick={() => setShowRmaModal(true)}>
            📄 Print RMA Slip
          </Button>
          {request.request_type === "exchange" && !request.exchange_order_id && (
            <Button type="button" variant="luxury" size="sm" onClick={openExchangeBuilder}>
              🔄 Generate Exchange Order
            </Button>
          )}
        </div>
      </div>

      {/* Case Header Card */}
      <div
        className={styles.formCard}
        style={{
          padding: "20px 24px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "var(--admin-text)" }}>
              Case #{request.id.slice(0, 8)}
            </h2>
            <span
              style={{
                fontSize: "11px",
                textTransform: "uppercase",
                padding: "3px 8px",
                borderRadius: "4px",
                fontWeight: 700,
                backgroundColor: request.request_type === "exchange" ? "rgba(59, 130, 246, 0.2)" : "rgba(233, 195, 73, 0.2)",
                color: request.request_type === "exchange" ? "#60a5fa" : "var(--color-gold)",
                border: "1px solid currentColor",
              }}
            >
              {request.request_type}
            </span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--admin-text-sub)" }}>
            Original Order: <Link href={`/admin/orders/${request.order_id}`} className={styles.tableLink}>#{request.order_id}</Link> • Customer: <strong>{request.customer_name}</strong> ({request.customer_phone})
          </p>
        </div>

        {/* Quick Lifecycle Action Buttons */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          {request.status === "requested" && (
            <>
              <Button
                type="button"
                variant="luxury"
                size="sm"
                onClick={() => handleAdvanceStatus("approved")}
                isLoading={saving}
              >
                ✓ Approve Return
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAdvanceStatus("rejected")}
                isLoading={saving}
                style={{ color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.4)" }}
              >
                ✕ Reject
              </Button>
            </>
          )}

          {request.status === "approved" && (
            <Button
              type="button"
              variant="luxury"
              size="sm"
              onClick={() => handleAdvanceStatus("received")}
              isLoading={saving}
            >
              📥 Mark Received at Hub
            </Button>
          )}

          {request.status === "received" && (
            <Button
              type="button"
              variant="luxury"
              size="sm"
              onClick={() => handleAdvanceStatus("inspected")}
              isLoading={saving}
            >
              🔍 Complete QC Inspection
            </Button>
          )}

          {request.status === "inspected" && (
            <Button
              type="button"
              variant="luxury"
              size="sm"
              onClick={() => handleAdvanceStatus("resolved")}
              isLoading={saving}
            >
              🎉 Resolve & Close Case
            </Button>
          )}

          {request.status === "resolved" && (
            <span style={{ fontSize: "12px", color: "#4ade80", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
              ✓ Case Resolved & Finalized
            </span>
          )}
        </div>
      </div>

      {/* Visual Lifecycle Stepper Pipeline */}
      {request.status !== "rejected" && request.status !== "cancelled" && (
        <div className={styles.formCard} style={{ padding: "16px 20px", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", position: "relative", overflowX: "auto", paddingBottom: "6px" }}>
            {LIFECYCLE_STEPS.map((step, idx) => {
              const isCompleted = currentStepIdx > idx;
              const isCurrent = currentStepIdx === idx;
              return (
                <div
                  key={step.key}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    flex: 1,
                    minWidth: "110px",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 700,
                      backgroundColor: isCompleted
                        ? "#10b981"
                        : isCurrent
                        ? "var(--color-gold)"
                        : "rgba(255,255,255,0.08)",
                      color: isCompleted || isCurrent ? "#121111" : "var(--admin-text-sub)",
                      border: isCurrent ? "2px solid #ffffff" : "none",
                      marginBottom: "6px",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {isCompleted ? "✓" : step.number}
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: isCurrent ? 700 : 500,
                      color: isCurrent ? "var(--color-gold)" : isCompleted ? "#ffffff" : "var(--admin-text-sub)",
                      textAlign: "center",
                    }}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2-Column Responsive Operations Layout */}
      <div className={styles.twoColLayout}>
        {/* LEFT / MAIN COLUMN */}
        <div className={styles.mainFormCol}>
          {/* Returned Items & Restock Inspection Card */}
          <div className={styles.formCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
              <div>
                <h3 className={styles.formCardTitle} style={{ margin: 0 }}>Returned Items & Quality Check</h3>
                <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--admin-text-sub)" }}>
                  Inspect condition and assign restock decisions for store inventory.
                </p>
              </div>
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
                  Mark All Write-Off
                </Button>
              </div>
            </div>

            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.tableTh}>Item / Variant</th>
                    <th className={styles.tableTh} style={{ width: "60px" }}>Qty</th>
                    <th className={styles.tableTh} style={{ width: "130px" }}>Condition</th>
                    <th className={styles.tableTh} style={{ width: "140px" }}>Restock Action</th>
                    <th className={styles.tableTh} style={{ width: "120px" }}>Restock Status</th>
                    <th className={styles.tableTh} style={{ width: "100px" }}>Refund</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const primaryImg =
                      item.product?.images?.find((img: any) => img.is_primary)?.url ||
                      item.product?.images?.[0]?.url;
                    const isAlreadyRestocked = Boolean(item.reason && item.reason.includes("[RESTOCKED:"));

                    return (
                      <tr key={item.id} className={styles.tableTr}>
                        <td className={styles.tableTd}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            {primaryImg ? (
                              <Image
                                src={primaryImg}
                                alt={item.product?.name || "Product"}
                                width={36}
                                height={36}
                                style={{ objectFit: "cover", borderRadius: "4px" }}
                              />
                            ) : (
                              <div style={{ width: 36, height: 36, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "4px" }} />
                            )}
                            <div>
                              <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--admin-text)" }}>
                                {item.product?.name || item.product_id || "Product"}
                              </div>
                              {item.variant?.size && (
                                <span style={{ fontSize: "11px", color: "var(--color-gold)" }}>Size: {item.variant.size}</span>
                              )}
                              {item.reason && (
                                <div style={{ fontSize: "10px", color: "var(--admin-text-sub)", marginTop: "2px" }}>
                                  Reason: {item.reason.replace(/\[RESTOCKED:[^\]]+\]/g, "").trim() || "None"}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className={styles.tableTd} style={{ fontWeight: 700 }}>
                          {item.quantity}
                        </td>

                        <td className={styles.tableTd}>
                          <select
                            value={item.condition_status || "unopened"}
                            onChange={(e) => handleItemConditionChange(item.id, e.target.value as ReturnConditionStatus)}
                            className={styles.formSelect}
                            style={{ padding: "4px 8px", fontSize: "11px" }}
                          >
                            <option value="unopened">Unopened</option>
                            <option value="unused">Unused / Tagged</option>
                            <option value="used">Used / Tried</option>
                            <option value="damaged">Damaged / Stained</option>
                            <option value="wrong_item">Wrong Item Sent</option>
                            <option value="defective">Defective Fabric</option>
                          </select>
                        </td>

                        <td className={styles.tableTd}>
                          <select
                            value={item.restock_action || "inspect_later"}
                            disabled={isAlreadyRestocked}
                            onChange={(e) => handleItemRestockActionChange(item.id, e.target.value as ReturnRestockAction)}
                            className={styles.formSelect}
                            style={{
                              padding: "4px 8px",
                              fontSize: "11px",
                              borderColor: item.restock_action === "restock" ? "#10b981" : undefined,
                              color: item.restock_action === "restock" ? "#10b981" : undefined,
                              fontWeight: item.restock_action === "restock" ? 600 : 400,
                            }}
                          >
                            <option value="inspect_later">Inspect later</option>
                            <option value="restock">Restock</option>
                            <option value="do_not_restock">Write-off / Scrap</option>
                          </select>
                        </td>

                        <td className={styles.tableTd}>
                          {isAlreadyRestocked ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px",
                                fontSize: "10px",
                                fontWeight: 700,
                                color: "#10b981",
                                backgroundColor: "rgba(16, 185, 129, 0.12)",
                                padding: "2px 6px",
                                borderRadius: "4px",
                              }}
                              title={item.reason || ""}
                            >
                              ✓ Restocked
                            </span>
                          ) : item.restock_action === "restock" ? (
                            <span style={{ fontSize: "10px", color: "#fbbf24", fontWeight: 600 }}>
                              Ready to restock
                            </span>
                          ) : (
                            <span style={{ fontSize: "10px", color: "var(--admin-text-sub)" }}>
                              Pending decision
                            </span>
                          )}
                        </td>

                        <td className={`${styles.tableTd} ${styles.tableTdHighlight}`} style={{ fontSize: "12px" }}>
                          {formatPKR(Number(item.refund_amount || 0))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Restock Action Trigger Card */}
            <div
              style={{
                marginTop: "16px",
                padding: "14px 16px",
                backgroundColor: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "6px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--admin-text)" }}>
                  Inventory Restock Engine (Safe & Idempotent)
                </div>
                <div style={{ fontSize: "11px", color: "var(--admin-text-sub)" }}>
                  {restockStats.markedRestockCount} item(s) pending restock • {restockStats.restockedCount} item(s) already restocked
                </div>
              </div>

              <Button
                type="button"
                variant="luxury"
                size="sm"
                onClick={handleSafeRestock}
                isLoading={restocking}
                disabled={restockStats.markedRestockCount === 0}
              >
                Restock Marked Items ({restockStats.markedRestockCount})
              </Button>
            </div>
          </div>

          {/* Reverse Logistics & Tracking */}
          <div className={styles.formCard}>
            <h3 className={styles.formCardTitle}>Reverse Logistics & Courier Booking</h3>
            <p style={{ margin: "2px 0 16px", fontSize: "12px", color: "var(--admin-text-sub)" }}>
              Record return shipping details for courier pickup from customer.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div className={styles.formGroup} style={{ margin: 0 }}>
                <label className={styles.formLabel}>Courier Service</label>
                <select
                  value={reverseCourierName}
                  onChange={(e) => handleCourierSelect(e.target.value)}
                  className={styles.formSelect}
                >
                  <option value="">Select or Type Courier</option>
                  {COURIER_PRESETS.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup} style={{ margin: 0 }}>
                <label className={styles.formLabel}>Reverse AWB / Tracking #</label>
                <input
                  type="text"
                  placeholder="e.g. 1002349129"
                  value={reverseTrackingNumber}
                  onChange={(e) => handleTrackingNumberChange(e.target.value)}
                  className={styles.formInput}
                />
              </div>
            </div>

            <div className={styles.formGroup} style={{ marginBottom: "16px" }}>
              <label className={styles.formLabel}>Tracking URL</label>
              <input
                type="url"
                placeholder="https://..."
                value={reverseTrackingUrl}
                onChange={(e) => setReverseTrackingUrl(e.target.value)}
                className={styles.formInput}
              />
            </div>

            {reverseTrackingUrl && (
              <div style={{ fontSize: "12px" }}>
                <a href={reverseTrackingUrl} target="_blank" rel="noreferrer" className={styles.tableLink}>
                  Open live reverse courier tracking ↗
                </a>
              </div>
            )}
          </div>

          {/* Resolution & Financial Settlement Form */}
          <form onSubmit={handleSaveForm} className={styles.formCard}>
            <h3 className={styles.formCardTitle}>Case Status & Financial Resolution</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div className={styles.formGroup} style={{ margin: 0 }}>
                <label className={styles.formLabel}>Current Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ReturnRequestStatus)}
                  className={styles.formSelect}
                >
                  <option value="draft">Draft</option>
                  <option value="requested">Requested (Under Review)</option>
                  <option value="approved">Approved (Reverse Courier Booked)</option>
                  <option value="received">Received at Hub</option>
                  <option value="inspected">Quality Inspected</option>
                  <option value="resolved">Resolved & Closed</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className={styles.formGroup} style={{ margin: 0 }}>
                <label className={styles.formLabel}>Resolution Outcome</label>
                <select
                  value={resolutionType}
                  onChange={(e) => setResolutionType(e.target.value as ReturnResolutionType | "")}
                  className={styles.formSelect}
                >
                  <option value="">Select Resolution</option>
                  {RESOLUTION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup} style={{ margin: 0 }}>
                <label className={styles.formLabel}>Refund Amount (PKR)</label>
                <input
                  type="number"
                  min={0}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup} style={{ margin: 0 }}>
                <label className={styles.formLabel}>Store Credit (PKR)</label>
                <input
                  type="number"
                  min={0}
                  value={storeCreditAmount}
                  onChange={(e) => setStoreCreditAmount(Number(e.target.value))}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup} style={{ margin: 0, gridColumn: "span 2" }}>
                <label className={styles.formLabel}>Exchange Replacement Order ID</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    placeholder="e.g. EXC-123456"
                    value={exchangeOrderId}
                    onChange={(e) => setExchangeOrderId(e.target.value)}
                    className={styles.formInput}
                    style={{ margin: 0, flexGrow: 1 }}
                  />
                  {exchangeOrderId && (
                    <Link
                      href={`/admin/orders/${exchangeOrderId}`}
                      target="_blank"
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "rgba(96, 165, 250, 0.1)",
                        color: "#60a5fa",
                        border: "1px solid rgba(96, 165, 250, 0.3)",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: 600,
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      View Order ↗
                    </Link>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Warehouse Inspection Notes</label>
              <textarea
                placeholder="Details of physical inspection, packaging integrity, tags attached..."
                value={conditionNotes}
                onChange={(e) => setConditionNotes(e.target.value)}
                className={styles.formTextarea}
                rows={2}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Internal Admin Notes</label>
              <textarea
                placeholder="Internal audit notes, communication logs with customer, bank transfer reference..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className={styles.formTextarea}
                rows={3}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <Button type="submit" variant="luxury" size="lg" isLoading={saving}>
                Save Case Changes
              </Button>
            </div>
          </form>
        </div>

        {/* RIGHT / SIDEBAR COLUMN */}
        <div className={styles.sidebarFormCol}>
          {/* Customer Summary Card */}
          <div className={styles.formCard}>
            <h3 className={styles.formCardTitle}>Customer Information</h3>
            <p className={styles.orderDetailText}><strong>Name:</strong> {request.customer_name}</p>
            <p className={styles.orderDetailText}><strong>Phone:</strong> {request.customer_phone}</p>
            <p className={styles.orderDetailText}><strong>Email:</strong> {request.customer_email || "-"}</p>
            {request.order?.shipping_address && (
              <p className={styles.orderDetailText} style={{ marginTop: "8px" }}>
                <strong>Shipping City:</strong> {request.order.shipping_address.city}
              </p>
            )}
          </div>

          {/* Original Order Summary Card */}
          <div className={styles.formCard}>
            <h3 className={styles.formCardTitle}>Original Order</h3>
            <p className={styles.orderDetailText}>
              <strong>Order ID:</strong>{" "}
              <Link href={`/admin/orders/${request.order_id}`} className={styles.tableLink}>
                #{request.order_id}
              </Link>
            </p>
            <p className={styles.orderDetailText}>
              <strong>Order Total:</strong> {formatPKR(Number(request.order?.total || 0))}
            </p>
            <p className={styles.orderDetailText}>
              <strong>Payment:</strong> {(request.order?.payment_method || "COD").toUpperCase()}
            </p>
            <p className={styles.orderDetailText}>
              <strong>Order Status:</strong> {request.order?.status || "delivered"}
            </p>
          </div>

          {/* Lifecycle Timestamps Card */}
          <div className={styles.formCard}>
            <h3 className={styles.formCardTitle}>Lifecycle Timeline</h3>
            <p className={styles.orderDetailText}><strong>Requested:</strong> {formatDate(request.requested_at)}</p>
            <p className={styles.orderDetailText}><strong>Approved:</strong> {formatDate(request.approved_at)}</p>
            <p className={styles.orderDetailText}><strong>Hub Received:</strong> {formatDate(request.received_at)}</p>
            <p className={styles.orderDetailText}><strong>Resolved:</strong> {formatDate(request.resolved_at)}</p>
            <p className={styles.orderDetailText}><strong>Last Updated:</strong> {formatDate(request.updated_at)}</p>
          </div>

          {/* Primary Reason Card */}
          <div className={styles.formCard}>
            <h3 className={styles.formCardTitle}>Customer Reason</h3>
            <p className={styles.orderDetailText} style={{ fontStyle: "italic", color: "var(--admin-text)" }}>
              &ldquo;{request.reason}&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* GENERATE EXCHANGE ORDER MODAL */}
      {showExchangeModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setShowExchangeModal(false)}
        >
          <div
            style={{
              backgroundColor: "#161515",
              border: "1px solid var(--admin-border)",
              borderRadius: "8px",
              width: "100%",
              maxWidth: "600px",
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 8px", fontSize: "16px", color: "var(--color-gold)" }}>
              Generate Replacement Exchange Order
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: "12px", color: "var(--admin-text-sub)" }}>
              Select the replacement product and size variant to generate an exchange order for {request.customer_name}.
            </p>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Select Replacement Product</label>
              <select
                className={styles.formSelect}
                value={selectedExchangeProduct?.id || ""}
                onChange={(e) => {
                  const prod = exchangeCatalog.find((p) => p.id === e.target.value) || null;
                  setSelectedExchangeProduct(prod);
                  setSelectedExchangeVariant(prod?.variants?.[0] || null);
                }}
              >
                <option value="">-- Choose Product --</option>
                {exchangeCatalog.map((prod) => (
                  <option key={prod.id} value={prod.id}>
                    {prod.name} ({formatPKR(Number(prod.price))})
                  </option>
                ))}
              </select>
            </div>

            {selectedExchangeProduct && selectedExchangeProduct.variants && selectedExchangeProduct.variants.length > 0 && (
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Select Size / Variant</label>
                <select
                  className={styles.formSelect}
                  value={selectedExchangeVariant?.id || ""}
                  onChange={(e) => {
                    const v = selectedExchangeProduct.variants?.find((va) => va.id === e.target.value) || null;
                    setSelectedExchangeVariant(v);
                  }}
                >
                  {selectedExchangeProduct.variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      Size: {v.size} (In Stock: {v.stock_quantity})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Quantity</label>
              <input
                type="number"
                min={1}
                value={exchangeQty}
                onChange={(e) => setExchangeQty(Math.max(1, Number(e.target.value)))}
                className={styles.formInput}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowExchangeModal(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="luxury"
                size="sm"
                onClick={handleCreateExchangeOrder}
                isLoading={exchangeGenerating}
                disabled={!selectedExchangeProduct}
              >
                Create Exchange Order
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE RMA SLIP MODAL */}
      {showRmaModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setShowRmaModal(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              color: "#111111",
              borderRadius: "8px",
              width: "100%",
              maxWidth: "700px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "32px",
              fontFamily: "Arial, sans-serif",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* RMA Header */}
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #111", paddingBottom: "12px", marginBottom: "20px" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>
                  Ayra Collection
                </h2>
                <span style={{ fontSize: "12px", color: "#555" }}>Return Merchandise Authorization (RMA)</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "18px", fontWeight: 800, fontFamily: "monospace" }}>
                  RMA-{request.id.slice(0, 8).toUpperCase()}
                </div>
                <div style={{ fontSize: "12px", color: "#555" }}>Date: {formatDate(request.requested_at)}</div>
              </div>
            </div>

            {/* Info Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px", fontSize: "13px" }}>
              <div style={{ border: "1px solid #ddd", padding: "12px", borderRadius: "4px" }}>
                <strong>Customer Information:</strong>
                <div style={{ marginTop: "4px" }}>Name: {request.customer_name}</div>
                <div>Phone: {request.customer_phone}</div>
                <div>Email: {request.customer_email || "N/A"}</div>
                {request.order?.shipping_address && (
                  <div>City: {request.order.shipping_address.city}</div>
                )}
              </div>

              <div style={{ border: "1px solid #ddd", padding: "12px", borderRadius: "4px" }}>
                <strong>Order & Case Details:</strong>
                <div style={{ marginTop: "4px" }}>Order ID: #{request.order_id}</div>
                <div>Request Type: {request.request_type.toUpperCase()}</div>
                <div>Status: {request.status.toUpperCase()}</div>
                <div>Courier: {request.reverse_courier_name || "Self / Pending"}</div>
              </div>
            </div>

            {/* Reason */}
            <div style={{ backgroundColor: "#f9f9f9", border: "1px solid #eee", padding: "10px 12px", borderRadius: "4px", marginBottom: "20px", fontSize: "13px" }}>
              <strong>Return Reason:</strong> {request.reason}
            </div>

            {/* Items Checklist Table */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "24px", fontSize: "12px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f0f0f0", borderBottom: "1px solid #ccc" }}>
                  <th style={{ padding: "8px", textAlign: "left" }}>Product</th>
                  <th style={{ padding: "8px", textAlign: "center", width: "50px" }}>Qty</th>
                  <th style={{ padding: "8px", textAlign: "left", width: "120px" }}>Reported Condition</th>
                  <th style={{ padding: "8px", textAlign: "center", width: "80px" }}>QC Check</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "8px" }}>
                      <strong>{it.product?.name || "Product"}</strong>
                      {it.variant?.size && <div>Size: {it.variant.size}</div>}
                    </td>
                    <td style={{ padding: "8px", textAlign: "center" }}>{it.quantity}</td>
                    <td style={{ padding: "8px", textTransform: "capitalize" }}>{it.condition_status.replace("_", " ")}</td>
                    <td style={{ padding: "8px", textAlign: "center" }}>[ &nbsp; ] PASS</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Inspection Signoff */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "24px", paddingTop: "16px", borderTop: "1px dashed #ccc", fontSize: "12px" }}>
              <div>
                <div>Inspected by (Signature): _____________________</div>
                <div style={{ marginTop: "8px" }}>Date: _____________________</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div>Warehouse Hub: <strong>Ayra Lahore Hub</strong></div>
                <div style={{ marginTop: "8px" }}>Stamp / Approval: [ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ]</div>
              </div>
            </div>

            {/* Print & Close Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px", borderTop: "1px solid #eee", paddingTop: "16px" }}>
              <button
                type="button"
                onClick={() => setShowRmaModal(false)}
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
                🖨️ Print Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
