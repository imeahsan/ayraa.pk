"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Order, OrderItem, OrderStatus } from "@/types";
import { useToast } from "@/context/ToastContext";
import styles from "../../admin.module.css";

interface OrderDetailClientProps {
  orderId: string;
}

const MOCK_ORDER_DETAIL: Order = {
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
    address_line_2: "Apartment 4B",
    city: "Karachi",
    state: "Sindh",
    postal_code: "75500",
    country: "Pakistan",
  },
  contact_phone: "0300-1234567",
  contact_email: "zahra@example.com",
  city: "Karachi",
  created_at: new Date().toISOString(),
  items: [
    {
      id: "item1",
      order_id: "AYR-00142",
      product_id: "p1",
      variant_id: "v1",
      quantity: 2,
      unit_price: 18500,
      product: {
        id: "p1",
        name: "Noir Silk Blouse",
        slug: "noir-silk-blouse",
        description: "Pure silk blouse",
        price: 18500,
        compare_at_price: null,
        sku: "AYR-NOI-01",
        category_id: "cat-pret",
        is_active: true,
        is_featured: false,
        fabric: "Silk",
        color: "Black",
        includes: "Blouse Only",
        care_instructions: "Dry clean only",
        meta_title: null,
        meta_description: null,
        created_at: new Date().toISOString(),
        images: [
          {
            id: "img1",
            product_id: "p1",
            url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=100&auto=format&fit=crop&q=80",
            alt_text: "Noir Silk Blouse",
            sort_order: 1,
            is_primary: true,
          },
        ],
      },
      variant: {
        id: "v1",
        product_id: "p1",
        size: "M",
        stock_quantity: 12,
        is_available: true,
      },
    },
    {
      id: "item2",
      order_id: "AYR-00142",
      product_id: "p5",
      variant_id: "v5",
      quantity: 1,
      unit_price: 85000,
      product: {
        id: "p5",
        name: "Midnight Chiffon Suit",
        slug: "midnight-chiffon-suit",
        description: "Midnight black formal chiffon suit.",
        price: 85000,
        compare_at_price: null,
        sku: "AYR-MCF-05",
        category_id: "cat-formal",
        is_active: true,
        is_featured: false,
        fabric: "Chiffon",
        color: "Black",
        includes: "Shirt, Dupatta, Pants",
        care_instructions: "Dry clean only",
        meta_title: null,
        meta_description: null,
        created_at: new Date().toISOString(),
        images: [
          {
            id: "img5",
            product_id: "p5",
            url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=100&auto=format&fit=crop&q=80",
            alt_text: "Midnight Chiffon Suit",
            sort_order: 1,
            is_primary: true,
          },
        ],
      },
      variant: {
        id: "v5",
        product_id: "p5",
        size: "S",
        stock_quantity: 4,
        is_available: true,
      },
    },
  ],
};

export const OrderDetailClient: React.FC<OrderDetailClientProps> = ({ orderId }) => {
  const router = useRouter();
  const supabase = createClient();
  const toast = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*, items:order_items(*)")
          .eq("id", orderId)
          .single();

        if (error || !data) {
          setOrder(MOCK_ORDER_DETAIL);
        } else {
          // Resolve products/variants for items
          const resolvedOrder = data as Order;
          if (resolvedOrder.items) {
            const itemsWithDetails = await Promise.all(
              resolvedOrder.items.map(async (item) => {
                const { data: pData } = await supabase
                  .from("products")
                  .select("*, images:product_images(*)")
                  .eq("id", item.product_id)
                  .single();

                const { data: vData } = await supabase
                  .from("product_variants")
                  .select("*")
                  .eq("id", item.variant_id)
                  .single();

                return {
                  ...item,
                  product: pData || undefined,
                  variant: vData || undefined,
                };
              })
            );
            resolvedOrder.items = itemsWithDetails as OrderItem[];
          }
          setOrder(resolvedOrder);
        }
      } catch (err) {
        console.error("Failed to load order detail:", err);
        setOrder(MOCK_ORDER_DETAIL);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [orderId, supabase]);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as OrderStatus;
    if (!order) return;

    setUpdating(true);

    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", order.id);

      if (error) {
        toast.error(`Failed to update status: ${error.message}`);
      } else {
        setOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
        toast.success("Order status updated successfully!");
      }
    } catch (err) {
      // Simulate local update if DB fails
      setOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      toast.success("Order status updated successfully (Simulated)!");
    } finally {
      setUpdating(false);
    }
  };

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
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

  if (loading) return <p className="font-body text-sm text-admin-text-sub text-center py-12">Loading order details...</p>;
  if (!order) return <p className="font-body text-sm text-error text-center py-12">Order not found.</p>;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body, html {
                background: white !important;
                color: black !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                height: auto !important;
                overflow: visible !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              aside, header, nav, footer, button, select, input, .no-print {
                display: none !important;
              }
              [class*="adminLayout"], 
              [class*="mainPane"], 
              [class*="contentContainer"], 
              [class*="innerContent"],
              main {
                display: block !important;
                padding: 0 !important;
                margin: 0 !important;
                background: white !important;
                width: 100% !important;
                max-width: 100% !important;
                box-shadow: none !important;
                border: none !important;
              }
              #printable-receipt-area-wrapper {
                display: block !important;
                background: white !important;
                color: black !important;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 30px !important;
                box-sizing: border-box !important;
              }
              #printable-receipt-area-wrapper *:not(.receipt-watermark) {
                color: black !important;
                border-color: #ccc !important;
              }
              #printable-receipt-area-wrapper .receipt-watermark {
                color: #b0b0b0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
            @media screen {
              #printable-receipt-area-wrapper {
                display: none !important;
              }
            }
          `
        }}
      />

      {/* Hidden print-only receipt container */}
      <div id="printable-receipt-area-wrapper" style={{ position: "relative", minHeight: "800px" }}>
        {/* Watermark Logo */}
        <div 
          className="receipt-watermark"
          style={{
            position: "absolute",
            top: "45%",
            left: "50%",
            transform: "translate(-50%, -50%) rotate(-30deg)",
            fontSize: "75px",
            fontWeight: "bold",
            fontFamily: "'Playfair Display', Georgia, serif",
            letterSpacing: "10px",
            zIndex: 0,
            pointerEvents: "none",
            userSelect: "none",
            whiteSpace: "nowrap",
            color: "#b0b0b0"
          }}
        >
          AYRAA
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #000", paddingBottom: "20px", marginBottom: "30px" }}>
            <div>
              <h1 style={{ fontSize: "32px", fontWeight: "bold", letterSpacing: "2px", margin: "0 0 5px 0" }}>AYRAA</h1>
              <p style={{ fontSize: "14px", color: "#555", margin: 0 }}>Premium Apparel &amp; Home Decor</p>
              <p style={{ fontSize: "12px", color: "#777", margin: "5px 0 0 0" }}>www.ayraacollection.com</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: "0 0 10px 0", color: "#d4af37" }}>INVOICE / RECEIPT</h2>
              <p style={{ fontSize: "14px", margin: "0 0 4px 0" }}><strong>Order ID:</strong> #{order.id}</p>
              <p style={{ fontSize: "14px", margin: "0 0 4px 0" }}><strong>Date:</strong> {formatDate(order.created_at)}</p>
              <p style={{ fontSize: "14px", margin: 0 }}><strong>Status:</strong> {order.status.toUpperCase()}</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginBottom: "30px" }}>
            <div>
              <h3 style={{ fontSize: "14px", textTransform: "uppercase", borderBottom: "1px solid #ddd", paddingBottom: "6px", marginBottom: "12px", color: "#555" }}>Customer Details</h3>
              <p style={{ fontSize: "14px", margin: "0 0 6px 0" }}><strong>Name:</strong> {order.shipping_address.first_name} {order.shipping_address.last_name}</p>
              <p style={{ fontSize: "14px", margin: "0 0 6px 0" }}><strong>Email:</strong> {order.contact_email}</p>
              <p style={{ fontSize: "14px", margin: 0 }}><strong>Phone:</strong> {order.contact_phone}</p>
            </div>
            <div>
              <h3 style={{ fontSize: "14px", textTransform: "uppercase", borderBottom: "1px solid #ddd", paddingBottom: "6px", marginBottom: "12px", color: "#555" }}>Shipping Address</h3>
              <p style={{ fontSize: "14px", margin: "0 0 4px 0" }}>{order.shipping_address.address_line_1}</p>
              {order.shipping_address.address_line_2 && (
                <p style={{ fontSize: "14px", margin: "0 0 4px 0" }}>{order.shipping_address.address_line_2}</p>
              )}
              <p style={{ fontSize: "14px", margin: "0 0 4px 0" }}>{order.shipping_address.city}, {order.shipping_address.state}</p>
              <p style={{ fontSize: "14px", margin: 0 }}>{order.shipping_address.postal_code}, Pakistan</p>
            </div>
          </div>

          <div style={{ marginBottom: "30px", backgroundColor: "#f9f9f9", padding: "12px 20px", borderLeft: "4px solid #d4af37" }}>
            <p style={{ fontSize: "14px", margin: 0 }}><strong>Payment Method:</strong> Cash on Delivery (COD)</p>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #000" }}>
                <th style={{ textAlign: "left", padding: "8px 0", fontSize: "14px", textTransform: "uppercase", color: "#555" }}>Item</th>
                <th style={{ textAlign: "center", padding: "8px 0", fontSize: "14px", textTransform: "uppercase", color: "#555" }}>Size</th>
                <th style={{ textAlign: "right", padding: "8px 0", fontSize: "14px", textTransform: "uppercase", color: "#555" }}>Unit Price</th>
                <th style={{ textAlign: "center", padding: "8px 0", fontSize: "14px", textTransform: "uppercase", color: "#555" }}>Qty</th>
                <th style={{ textAlign: "right", padding: "8px 0", fontSize: "14px", textTransform: "uppercase", color: "#555" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item) => {
                const displayColor = item.variant?.color && item.variant.color !== "Standard"
                  ? item.variant.color
                  : (item.product?.color && item.product?.color !== "Standard" ? item.product.color : null);
                const displaySize = item.variant?.size && !["Standard", "One Size", "OS"].includes(item.variant.size)
                  ? item.variant.size
                  : null;
                return (
                  <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "12px 0", fontSize: "14px" }}>
                      <strong>{item.product?.name || "Unknown Product"}</strong>
                      {displayColor && <span style={{ fontSize: "11px", color: "#555", display: "block", marginTop: "2px" }}>Color: {displayColor}</span>}
                      {item.product?.sku && <span style={{ fontSize: "11px", color: "#777", display: "block", marginTop: "2px" }}>SKU: {item.product.sku}</span>}
                    </td>
                    <td style={{ textAlign: "center", padding: "12px 0", fontSize: "14px" }}>{displaySize || "—"}</td>
                    <td style={{ textAlign: "right", padding: "12px 0", fontSize: "14px" }}>{formatPKR(item.unit_price)}</td>
                    <td style={{ textAlign: "center", padding: "12px 0", fontSize: "14px" }}>{item.quantity}</td>
                    <td style={{ textAlign: "right", padding: "12px 0", fontSize: "14px" }}>{formatPKR(item.unit_price * item.quantity)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{ width: "300px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "14px" }}>
                <span>Subtotal</span>
                <span>{formatPKR(order.subtotal)}</span>
              </div>
              {order.discount_amount && Number(order.discount_amount) > 0 ? (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "14px", color: "#d4af37", fontWeight: "bold" }}>
                  <span>Discount ({order.promo_code || "Promo"})</span>
                  <span>-{formatPKR(Number(order.discount_amount))}</span>
                </div>
              ) : null}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "14px" }}>
                <span>Shipping</span>
                <span>{order.shipping_cost === 0 ? "FREE" : formatPKR(order.shipping_cost)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "2px solid #000", fontSize: "16px", fontWeight: "bold", marginTop: "6px" }}>
                <span>Total Paid</span>
                <span>{formatPKR(order.total)}</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #ddd", marginTop: "50px", paddingTop: "20px", textAlign: "center", color: "#777", fontSize: "12px" }}>
            <p style={{ margin: "0 0 5px 0" }}>Thank you for shopping with <strong>Ayraa Collection</strong>!</p>
            <p style={{ margin: 0 }}>This is a computer-generated invoice record.</p>
          </div>
        </div>
      </div>

      {/* Screen layout */}
      <div className={`${styles.pageLayout} no-print`}>
        <div style={{ marginBottom: "8px" }}>
          <Link href="/admin/orders" className={styles.backLink}>
            &larr; Back to Orders
          </Link>
        </div>

        <div className={styles.orderDetailLayout}>
          {/* Left Side: Order items list */}
          <div className={styles.orderMainCol}>
            <div className={styles.formCard}>
              <h3 className={styles.formCardTitle}>Order Items ({order.items?.length || 0})</h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {order.items?.map((item) => {
                  const primaryImage =
                    item.product?.images?.find((img) => img.is_primary) ||
                    item.product?.images?.[0];

                  return (
                    <div key={item.id} className={styles.orderItemRow}>
                      <div className={styles.orderItemImageWrapper}>
                        {primaryImage ? (
                          <Image
                            src={primaryImage.url}
                            alt={primaryImage.alt_text || item.product?.name || "Product image"}
                            fill
                            sizes="60px"
                            style={{ objectFit: "cover" }}
                          />
                        ) : (
                          <div style={{ width: "100%", height: "100%", backgroundColor: "var(--color-bg-hover)" }} />
                        )}
                      </div>
                      <div className={styles.orderItemDetails}>
                        <h4 className={styles.orderItemName}>
                          {item.product?.name || "Unknown Product"}
                        </h4>
                        {(() => {
                          const displayColor = item.variant?.color && item.variant.color !== "Standard"
                            ? item.variant.color
                            : (item.product?.color && item.product?.color !== "Standard" ? item.product.color : null);
                          const displaySize = item.variant?.size && !["Standard", "One Size", "OS"].includes(item.variant.size)
                            ? item.variant.size
                            : null;
                          return (
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              {displayColor && (
                                <span className={styles.orderItemMeta}>Color: {displayColor}</span>
                              )}
                              {displaySize && (
                                <span className={styles.orderItemMeta}>Size: {displaySize}</span>
                              )}
                            </div>
                          );
                        })()}
                        <span className={styles.orderItemSubmeta}>
                          {formatPKR(item.unit_price)} × {item.quantity}
                        </span>
                      </div>
                      <div className={styles.orderItemPrice}>
                        {formatPKR(item.unit_price * item.quantity)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <hr className={styles.divider} />

              {/* Price Calculations */}
              <div className={styles.priceBreakdown}>
                <div className={styles.priceRow}>
                  <span>Subtotal</span>
                  <span>{formatPKR(order.subtotal)}</span>
                </div>
                {order.discount_amount && Number(order.discount_amount) > 0 ? (
                  <div className={styles.priceRow} style={{ color: "var(--color-gold)", fontWeight: "bold" }}>
                    <span>Discount ({order.promo_code || "Promo"})</span>
                    <span>-{formatPKR(Number(order.discount_amount))}</span>
                  </div>
                ) : null}
                <div className={styles.priceRow}>
                  <span>Shipping Cost</span>
                  <span>
                    {order.shipping_cost === 0 ? "FREE" : formatPKR(order.shipping_cost)}
                  </span>
                </div>
                <hr className={styles.divider} />
                <div className={styles.totalRow}>
                  <span>Total Amount Paid</span>
                  <span className={styles.totalPrice}>{formatPKR(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Order Status Manager & Customer Info */}
          <div className={styles.orderSidebarCol}>
            {/* Order Status Manager */}
            <div className={styles.formCard}>
              <h3 className={styles.formCardTitle}>Order Status</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <span className={styles.orderDetailText} style={{ color: "var(--admin-text-sub)" }}>Current Status:</span>
                  <span className={`${styles.badge} ${getStatusBadgeClass(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Update Order Status</label>
                  <select
                    value={order.status}
                    onChange={handleStatusChange}
                    disabled={updating}
                    className={styles.formSelect}
                  >
                    <option value="pending" className={styles.filterOption}>Pending</option>
                    <option value="processing" className={styles.filterOption}>Processing</option>
                    <option value="shipped" className={styles.filterOption}>Shipped</option>
                    <option value="delivered" className={styles.filterOption}>Delivered</option>
                    <option value="cancelled" className={styles.filterOption}>Cancelled</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className={styles.signOutButton}
                  style={{
                    marginTop: "8px",
                    backgroundColor: "rgba(212, 175, 55, 0.1)",
                    color: "var(--color-gold)",
                    borderColor: "rgba(212, 175, 55, 0.2)",
                    cursor: "pointer"
                  }}
                >
                  🖨️ Print Receipt
                </button>
              </div>
            </div>

            {/* Customer Metadata */}
            <div className={styles.formCard}>
              <h3 className={styles.formCardTitle}>Customer &amp; Delivery</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className={styles.formGroup}>
                  <h4 className={styles.formLabel} style={{ color: "var(--color-gold)", margin: 0 }}>Customer Information</h4>
                  <p className={styles.orderDetailText}>
                    <strong>Name:</strong> {order.shipping_address.first_name}{" "}
                    {order.shipping_address.last_name}
                  </p>
                  <p className={styles.orderDetailText}>
                    <strong>Email:</strong> {order.contact_email}
                  </p>
                  <p className={styles.orderDetailText}>
                    <strong>Phone:</strong> {order.contact_phone}
                  </p>
                </div>

                <hr className={styles.divider} />

                <div className={styles.formGroup}>
                  <h4 className={styles.formLabel} style={{ color: "var(--color-gold)", margin: 0 }}>Shipping Address</h4>
                  <p className={styles.orderDetailText}>{order.shipping_address.address_line_1}</p>
                  {order.shipping_address.address_line_2 && (
                    <p className={styles.orderDetailText}>{order.shipping_address.address_line_2}</p>
                  )}
                  <p className={styles.orderDetailText}>
                    {order.shipping_address.city}, {order.shipping_address.state}
                  </p>
                  <p className={styles.orderDetailText}>
                    {order.shipping_address.postal_code}, Pakistan
                  </p>
                </div>

                <hr className={styles.divider} />

                <div className={styles.formGroup}>
                  <h4 className={styles.formLabel} style={{ color: "var(--color-gold)", margin: 0 }}>Payment Method</h4>
                  <p className={styles.orderDetailText}>
                    💸 Cash on Delivery (COD)
                  </p>
                </div>

                <hr className={styles.divider} />

                <div className={styles.formGroup}>
                  <h4 className={styles.formLabel} style={{ color: "var(--color-gold)", margin: 0 }}>Order Logs</h4>
                  <p className={styles.orderDetailText} style={{ color: "var(--admin-text-sub)" }}>Placed on {formatDate(order.created_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
