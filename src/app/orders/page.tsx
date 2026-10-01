"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/storefront/Header/Header";
import { Footer } from "@/components/storefront/Footer/Footer";
import { Button } from "@/components/storefront/Button/Button";
import { Breadcrumb } from "@/components/storefront/Breadcrumb/Breadcrumb";
import { useToast } from "@/context/ToastContext";
import Loading from "@/app/loading";
import { requestCustomerReturn } from "@/app/actions/returns";
import { OrderReturnRequest, ReturnRequestType } from "@/types";
import styles from "./orders.module.css";

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price: number;
  product?: {
    name: string;
    slug: string;
    images?: Array<{
      url: string;
      is_primary: boolean;
    }>;
  };
  variant?: {
    size?: string;
  };
}

interface Order {
  id: string;
  user_id: string | null;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "returned";
  payment_method: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  created_at: string;
  order_items: OrderItem[];
}

export default function CustomerOrdersPage() {
  const supabase = createClient();
  const toast = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [returnRequests, setReturnRequests] = useState<OrderReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  // Customer Return Modal State
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState<Order | null>(null);
  const [selectedReturnItems, setSelectedReturnItems] = useState<Record<string, { selected: boolean; quantity: number }>>({});
  const [returnType, setReturnType] = useState<ReturnRequestType>("return");
  const [returnReason, setReturnReason] = useState("Size too small");
  const [returnNotes, setReturnNotes] = useState("");
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const fetchOrdersAndReturns = async (userId: string) => {
    try {
      const [{ data: ordersData, error: ordersError }, { data: returnsData }] = await Promise.all([
        supabase
          .from("orders")
          .select(`
            *,
            order_items (
              *,
              product:products (
                name,
                slug,
                images:product_images (
                  url,
                  is_primary
                )
              ),
              variant:product_variants ( size )
            )
          `)
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("order_return_requests")
          .select("*")
          .eq("created_by", userId)
          .order("created_at", { ascending: false }),
      ]);

      if (ordersError) throw ordersError;
      setOrders((ordersData as any) || []);
      setReturnRequests((returnsData || []) as OrderReturnRequest[]);
    } catch (err) {
      console.error("Failed to load customer orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setIsLoggedIn(true);
        fetchOrdersAndReturns(user.id);
      } else {
        setIsLoggedIn(false);
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const formatPKR = (amount: number) => {
    return Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const openReturnModal = (order: Order) => {
    setSelectedOrderForReturn(order);
    const initialItemMap: Record<string, { selected: boolean; quantity: number }> = {};
    order.order_items.forEach((item) => {
      initialItemMap[item.id] = { selected: true, quantity: item.quantity };
    });
    setSelectedReturnItems(initialItemMap);
    setReturnType("return");
    setReturnReason("Size too small");
    setReturnNotes("");
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForReturn) return;

    const itemsToReturn = selectedOrderForReturn.order_items
      .filter((item) => selectedReturnItems[item.id]?.selected)
      .map((item) => ({
        order_item_id: item.id,
        quantity: selectedReturnItems[item.id]?.quantity || 1,
        reason: returnReason,
      }));

    if (itemsToReturn.length === 0) {
      toast.warning("Please select at least one item to return or exchange.");
      return;
    }

    setSubmittingReturn(true);
    try {
      const res = await requestCustomerReturn({
        order_id: selectedOrderForReturn.id,
        request_type: returnType,
        reason: returnReason,
        notes: returnNotes,
        items: itemsToReturn,
      });

      if (!res.success) {
        throw new Error(res.error || "Failed to submit return request.");
      }

      toast.success("Return request submitted successfully! Our support team will review it shortly.");
      setSelectedOrderForReturn(null);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) await fetchOrdersAndReturns(user.id);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit return request.");
    } finally {
      setSubmittingReturn(false);
    }
  };

  const getReturnForOrder = (orderId: string) =>
    returnRequests.find((r) => r.order_id === orderId);

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Header />

      <main className="grow pt-20 md:pt-16">
        <div className={styles.container}>
          <Breadcrumb items={[{ label: "My Orders", url: "/orders" }]} />

          <h1 className={styles.pageTitle}>My Orders</h1>

          {loading ? (
            <Loading />
          ) : isLoggedIn === false ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>Please sign in to view your orders history.</p>
              <Link href={`/login?redirectTo=${encodeURIComponent("/orders")}`}>
                <Button variant="luxury" size="lg">
                  Sign In
                </Button>
              </Link>
            </div>
          ) : orders.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>You have not placed any orders yet.</p>
              <Link href="/collections">
                <Button variant="luxury" size="lg">
                  Start Shopping
                </Button>
              </Link>
            </div>
          ) : (
            <div>
              {orders.map((order) => {
                const linkedReturn = getReturnForOrder(order.id);
                const isDelivered = order.status === "delivered";

                return (
                  <div key={order.id} className={styles.orderCard}>
                    {/* Order Header */}
                    <div className={styles.orderHeader}>
                      <div className={styles.headerLeft}>
                        <div className={styles.metaGroup}>
                          <span className={styles.metaLabel}>Order ID</span>
                          <span className={`${styles.metaValue} ${styles.orderId}`}>#{order.id}</span>
                        </div>
                        <div className={styles.metaGroup}>
                          <span className={styles.metaLabel}>Date Placed</span>
                          <span className={styles.metaValue}>{formatDate(order.created_at)}</span>
                        </div>
                        <div className={styles.metaGroup}>
                          <span className={styles.metaLabel}>Total Price</span>
                          <span className={styles.metaValue}>{formatPKR(order.total)}</span>
                        </div>
                        <div className={styles.metaGroup}>
                          <span className={styles.metaLabel}>Payment Method</span>
                          <span className={styles.metaValue} style={{ textTransform: "uppercase" }}>
                            {order.payment_method}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <span className={`${styles.statusBadge} ${styles[`status-${order.status}`]}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>

                    {/* Return Request Status Notification if Active */}
                    {linkedReturn && (
                      <div
                        style={{
                          backgroundColor: "rgba(233, 195, 73, 0.08)",
                          borderLeft: "3px solid var(--color-gold)",
                          padding: "10px 16px",
                          margin: "12px 16px 0",
                          borderRadius: "4px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "12px",
                        }}
                      >
                        <div>
                          <strong style={{ color: "var(--color-gold)", textTransform: "capitalize" }}>
                            {linkedReturn.request_type} Case #{linkedReturn.id.slice(0, 8)}
                          </strong>{" "}
                          — Status:{" "}
                          <span style={{ fontWeight: 600, color: "#ffffff", textTransform: "uppercase" }}>
                            {linkedReturn.status}
                          </span>
                          {linkedReturn.reverse_tracking_number && (
                            <span style={{ marginLeft: "8px", color: "var(--color-on-surface-sub)" }}>
                              (Courier: {linkedReturn.reverse_courier_name} • AWB: {linkedReturn.reverse_tracking_number})
                            </span>
                          )}
                        </div>
                        <span style={{ color: "var(--color-on-surface-sub)", fontSize: "11px" }}>
                          Requested on {formatDate(linkedReturn.requested_at)}
                        </span>
                      </div>
                    )}

                    {/* Order Items List */}
                    <div className={styles.itemsList}>
                      {order.order_items.map((item) => {
                        const primaryImg =
                          item.product?.images?.find((img) => img.is_primary) || item.product?.images?.[0];
                        return (
                          <div key={item.id} className={styles.itemRow}>
                            <div className={styles.itemImageWrapper}>
                              {primaryImg?.url ? (
                                <Image
                                  src={primaryImg.url}
                                  alt={item.product?.name || "Product image"}
                                  fill
                                  sizes="60px"
                                  style={{ objectFit: "cover" }}
                                />
                              ) : (
                                <div style={{ width: "100%", height: "100%", backgroundColor: "rgba(255,255,255,0.02)" }} />
                              )}
                            </div>
                            <div className={styles.itemDetails}>
                              <h4 className={styles.itemName}>
                                {item.product ? (
                                  <Link
                                    href={`/product/${item.product.slug}`}
                                    className="hover:underline"
                                    style={{ color: "inherit", textDecoration: "none" }}
                                  >
                                    {item.product.name}
                                  </Link>
                                ) : (
                                  "Unknown Product"
                                )}
                              </h4>
                              <span className={styles.itemMeta}>
                                Qty: {item.quantity} {item.variant?.size ? `• Size: ${item.variant.size}` : ""} | Price: {formatPKR(item.unit_price)}
                              </span>
                            </div>
                            <span className={styles.itemPrice}>
                              {formatPKR(item.unit_price * item.quantity)}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Order Footer & Return Request CTA */}
                    <div
                      style={{
                        padding: "12px 16px",
                        borderTop: "1px solid rgba(255,255,255,0.04)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Link href="/shipping-returns" style={{ fontSize: "11px", color: "var(--color-on-surface-sub)", textDecoration: "underline" }}>
                        View 7-Day Return & Exchange Policy
                      </Link>

                      {isDelivered && !linkedReturn && (
                        <button
                          type="button"
                          onClick={() => openReturnModal(order)}
                          style={{
                            padding: "6px 14px",
                            backgroundColor: "rgba(233, 195, 73, 0.1)",
                            color: "var(--color-gold)",
                            border: "1px solid rgba(233, 195, 73, 0.3)",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                        >
                          🔄 Request Return / Exchange
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* CUSTOMER RETURN / EXCHANGE MODAL */}
      {selectedOrderForReturn && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(6px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setSelectedOrderForReturn(null)}
        >
          <div
            style={{
              backgroundColor: "#161515",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              width: "100%",
              maxWidth: "580px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.8)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "var(--color-gold)" }}>
                Return or Exchange Request
              </h3>
              <button
                type="button"
                onClick={() => setSelectedOrderForReturn(null)}
                style={{ background: "none", border: "none", color: "#888", fontSize: "20px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: "0 0 16px", fontSize: "12px", color: "var(--color-on-surface-sub)" }}>
              Order #{selectedOrderForReturn.id} • Placed on {formatDate(selectedOrderForReturn.created_at)}
            </p>

            <form onSubmit={handleSubmitReturn}>
              {/* Type selector */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "var(--color-on-surface-sub)", marginBottom: "4px" }}>
                  What would you like to request?
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setReturnType("return")}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      border: returnType === "return" ? "1px solid var(--color-gold)" : "1px solid rgba(255,255,255,0.1)",
                      backgroundColor: returnType === "return" ? "rgba(233, 195, 73, 0.15)" : "transparent",
                      color: returnType === "return" ? "var(--color-gold)" : "#ccc",
                    }}
                  >
                    Return for Refund
                  </button>
                  <button
                    type="button"
                    onClick={() => setReturnType("exchange")}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      border: returnType === "exchange" ? "1px solid var(--color-gold)" : "1px solid rgba(255,255,255,0.1)",
                      backgroundColor: returnType === "exchange" ? "rgba(233, 195, 73, 0.15)" : "transparent",
                      color: returnType === "exchange" ? "var(--color-gold)" : "#ccc",
                    }}
                  >
                    Size / Color Exchange
                  </button>
                </div>
              </div>

              {/* Items selection */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "var(--color-on-surface-sub)", marginBottom: "6px" }}>
                  Select items to include:
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {selectedOrderForReturn.order_items.map((item) => {
                    const itemState = selectedReturnItems[item.id] || { selected: false, quantity: 1 };
                    return (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 12px",
                          backgroundColor: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          borderRadius: "4px",
                          fontSize: "12px",
                        }}
                      >
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", flexGrow: 1 }}>
                          <input
                            type="checkbox"
                            checked={itemState.selected}
                            onChange={(e) =>
                              setSelectedReturnItems((prev) => ({
                                ...prev,
                                [item.id]: { ...itemState, selected: e.target.checked },
                              }))
                            }
                          />
                          <span>{item.product?.name || "Product"} {item.variant?.size ? `(${item.variant.size})` : ""}</span>
                        </label>
                        <span style={{ color: "var(--color-gold)" }}>{formatPKR(item.unit_price)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reason */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "var(--color-on-surface-sub)", marginBottom: "4px" }}>
                  Reason for Return / Exchange
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "4px",
                    backgroundColor: "#201f1f",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                >
                  <option value="Size too small">Size too small</option>
                  <option value="Size too large">Size too large</option>
                  <option value="Fabric defect or damage">Fabric defect or damage</option>
                  <option value="Color looks different from picture">Color looks different from picture</option>
                  <option value="Received wrong item">Received wrong item</option>
                  <option value="Changed mind / style preference">Changed mind / style preference</option>
                </select>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "var(--color-on-surface-sub)", marginBottom: "4px" }}>
                  Additional Details (Optional)
                </label>
                <textarea
                  placeholder="Provide any additional details or preferred exchange size..."
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  rows={2}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "4px",
                    backgroundColor: "#201f1f",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <Button type="button" variant="outline" size="sm" onClick={() => setSelectedOrderForReturn(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="luxury" size="sm" isLoading={submittingReturn}>
                  Submit Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
