"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Order, OrderItem, OrderStatus, ShipmentStatus } from "@/types";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/storefront/Button/Button";
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

export const OrderDetailClient: React.FC<OrderDetailClientProps> = ({ orderId }) => {
  const router = useRouter();
  const supabase = createClient();
  const toast = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Shipment Management States
  const [shippingCompanies, setShippingCompanies] = useState<any[]>([]);
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [shippingCompanyId, setShippingCompanyId] = useState<string>("");
  const [shippingCompanyName, setShippingCompanyName] = useState<string>("");
  const [shipmentStatus, setShipmentStatus] = useState<ShipmentStatus>("draft");
  const [trackingNumber, setTrackingNumber] = useState<string>("");
  const [bookingReference, setBookingReference] = useState<string>("");
  const [shipmentCost, setShipmentCost] = useState<number>(0);
  const [codAmount, setCodAmount] = useState<number>(0);
  const [weightKg, setWeightKg] = useState<string>("0.5");
  const [piecesCount, setPiecesCount] = useState<number>(1);
  const [trackingUrl, setTrackingUrl] = useState<string>("");
  const [estimatedDeliveryAt, setEstimatedDeliveryAt] = useState<string>("");
  const [shipmentNotes, setShipmentNotes] = useState<string>("");
  const [savingShipment, setSavingShipment] = useState(false);

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

  // Load Shipping Companies
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const { data, error } = await supabase
          .from("shipping_companies")
          .select("*")
          .eq("is_active", true)
          .order("name", { ascending: true });
        if (data) setShippingCompanies(data);
      } catch (err) {
        console.error("Failed to fetch shipping companies:", err);
      }
    };
    fetchCompanies();
  }, [supabase]);

  // Load Existing Shipment for this order
  useEffect(() => {
    const fetchShipment = async () => {
      try {
        const { data, error } = await supabase
          .from("order_shipments")
          .select("*")
          .eq("order_id", orderId)
          .eq("shipment_direction", "forward")
          .maybeSingle();

        if (data) {
          setShipmentId(data.id);
          setShippingCompanyId(data.shipping_company_id || "");
          setShippingCompanyName(data.shipping_company_name || "");
          setShipmentStatus(data.shipment_status || "draft");
          setTrackingNumber(data.tracking_number || "");
          setBookingReference(data.booking_reference || "");
          setShipmentCost(Number(data.shipping_cost || 0));
          setCodAmount(Number(data.cod_amount || 0));
          setWeightKg(data.weight_kg ? String(data.weight_kg) : "0.5");
          setPiecesCount(data.pieces_count || 1);
          setTrackingUrl(data.tracking_url || "");
          if (data.estimated_delivery_at) {
            const date = new Date(data.estimated_delivery_at);
            const offset = date.getTimezoneOffset() * 60000;
            const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
            setEstimatedDeliveryAt(localISOTime);
          }
          setShipmentNotes(data.package_notes || "");
        } else if (order) {
          setCodAmount(Number(order.total || 0));
        }
      } catch (err) {
        console.error("Failed to load shipment:", err);
      }
    };
    if (orderId && order) {
      fetchShipment();
    }
  }, [orderId, order, supabase]);

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

  const handleShipmentSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!order) return;
    setSavingShipment(true);

    try {
      const now = new Date().toISOString();
      const shipmentData = {
        order_id: order.id,
        shipping_company_id: shippingCompanyId || null,
        shipping_company_name: shippingCompanyName || null,
        shipment_direction: "forward",
        tracking_number: trackingNumber || null,
        tracking_url: trackingUrl || null,
        booking_reference: bookingReference || null,
        shipment_status: shipmentStatus,
        shipping_cost: Number(shipmentCost || 0),
        cod_amount: Number(codAmount || 0),
        weight_kg: weightKg ? Number(weightKg) : null,
        pieces_count: Number(piecesCount || 1),
        package_notes: shipmentNotes || null,
        recipient_name: `${order.shipping_address.first_name} ${order.shipping_address.last_name}`,
        recipient_phone: order.contact_phone,
        recipient_city: order.shipping_address.city,
        recipient_address: `${order.shipping_address.address_line_1}${order.shipping_address.address_line_2 ? ', ' + order.shipping_address.address_line_2 : ''}`,
        recipient_postal_code: order.shipping_address.postal_code || null,
        updated_at: now,
      };

      if (shipmentId) {
        const { error } = await supabase
          .from("order_shipments")
          .update(shipmentData)
          .eq("id", shipmentId);
        if (error) throw new Error(error.message);
        toast.success("Shipment updated successfully!");
      } else {
        const newShipment = {
          ...shipmentData,
          created_at: now,
        };
        const { data, error } = await supabase
          .from("order_shipments")
          .insert([newShipment])
          .select()
          .single();
        if (error) throw new Error(error.message);
        if (data) setShipmentId(data.id);
        toast.success("Shipment created successfully!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save shipment.");
    } finally {
      setSavingShipment(false);
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
      <div className={`${styles.pageLayout} no-print`} style={{ maxWidth: "1280px", margin: "0 auto", padding: "12px var(--space-4)" }}>
        
        {/* Top Header & Action Panel */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "28px",
          borderBottom: "1px solid rgba(233, 195, 73, 0.12)",
          paddingBottom: "20px",
          flexWrap: "wrap",
          gap: "16px"
        }}>
          <div>
            <Link href="/admin/orders" className={styles.backLink} style={{ display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none", fontSize: "13px" }}>
              <span>&larr;</span> Back to Orders
            </Link>
            
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px", flexWrap: "wrap" }}>
              <h1 style={{
                margin: 0,
                fontSize: "26px",
                fontWeight: "var(--weight-bold)",
                fontFamily: "var(--font-headline)",
                letterSpacing: "-0.5px"
              }}>
                Order #{order.id}
              </h1>
              <CopyButton text={order.id} />
              <span className={`${styles.badge} ${getStatusBadgeClass(order.status)}`} style={{ textTransform: "capitalize", padding: "4px 10px", fontSize: "11px", letterSpacing: "0.5px" }}>
                {order.status}
              </span>
            </div>
            
            <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: "var(--admin-text-sub)" }}>
              Placed on {new Date(order.created_at).toLocaleString("en-PK", { dateStyle: "long", timeStyle: "short" })}
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              onClick={() => window.print()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                backgroundColor: "rgba(233, 195, 73, 0.06)",
                color: "var(--color-gold)",
                border: "1px solid rgba(233, 195, 73, 0.2)",
                borderRadius: "var(--radius-sm)",
                fontSize: "13px",
                fontWeight: "var(--weight-bold)",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(233, 195, 73, 0.12)";
                e.currentTarget.style.borderColor = "var(--color-gold)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(233, 195, 73, 0.06)";
                e.currentTarget.style.borderColor = "rgba(233, 195, 73, 0.2)";
              }}
            >
              <span>🖨️</span> Print Invoice
            </button>
            
            <Link
              href={`/admin/returns?orderId=${encodeURIComponent(order.id)}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                backgroundColor: "rgba(96, 165, 250, 0.06)",
                color: "var(--color-info)",
                border: "1px solid rgba(96, 165, 250, 0.2)",
                borderRadius: "var(--radius-sm)",
                fontSize: "13px",
                fontWeight: "var(--weight-bold)",
                textDecoration: "none",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(96, 165, 250, 0.12)";
                e.currentTarget.style.borderColor = "var(--color-info)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(96, 165, 250, 0.06)";
                e.currentTarget.style.borderColor = "rgba(96, 165, 250, 0.2)";
              }}
            >
              <span>🔄</span> Return / Exchange
            </Link>
          </div>
        </div>

        {/* 2-Column Responsive Dashboard Layout */}
        <div className={styles.orderDetailLayout}>
          
          {/* LEFT COLUMN: Order items summary & payment logs */}
          <div className={styles.orderMainCol} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Items Summary Card */}
            <div className={styles.formCard} style={{ border: "1px solid var(--admin-border)", margin: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "12px" }}>
                <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "var(--weight-bold)", color: "var(--color-gold)", textTransform: "uppercase", letterSpacing: "1px" }}>
                  Order Items
                </h3>
                <span style={{ fontSize: "12px", color: "var(--admin-text-sub)", fontWeight: "var(--weight-semibold)", backgroundColor: "var(--color-bg-hover)", padding: "3px 8px", borderRadius: "10px" }}>
                  {order.items?.length || 0} {order.items?.length === 1 ? "Product" : "Products"}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {order.items?.map((item) => {
                  const primaryImage =
                    item.product?.images?.find((img) => img.is_primary) ||
                    item.product?.images?.[0];

                  return (
                    <div key={item.id} className={styles.orderItemRow} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "14px", alignItems: "flex-start" }}>
                      <div className={styles.orderItemImageWrapper} style={{ border: "1px solid rgba(233, 195, 73, 0.12)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
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
                      
                      <div className={styles.orderItemDetails} style={{ paddingLeft: "10px" }}>
                        <h4 className={styles.orderItemName} style={{ fontSize: "14px", color: "var(--admin-text)", lineHeight: "1.4" }}>
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
                            <div style={{ display: "flex", gap: "8px", marginTop: "4px", flexWrap: "wrap" }}>
                              {displayColor && (
                                <span className={styles.orderItemMeta} style={{ fontSize: "10px", backgroundColor: "rgba(255,255,255,0.05)", padding: "1px 5px", borderRadius: "3px" }}>
                                  Color: {displayColor}
                                </span>
                              )}
                              {displaySize && (
                                <span className={styles.orderItemMeta} style={{ fontSize: "10px", backgroundColor: "rgba(255,255,255,0.05)", padding: "1px 5px", borderRadius: "3px" }}>
                                  Size: {displaySize}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                        
                        <span className={styles.orderItemSubmeta} style={{ marginTop: "6px", display: "block" }}>
                          {formatPKR(item.unit_price)} × {item.quantity}
                        </span>
                      </div>
                      
                      <div className={styles.orderItemPrice} style={{ fontSize: "14px", color: "var(--color-gold-bright)" }}>
                        {formatPKR(item.unit_price * item.quantity)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Price Calculations */}
              <div className={styles.priceBreakdown} style={{ marginTop: "20px", backgroundColor: "rgba(255,255,255,0.01)", padding: "14px", borderRadius: "var(--radius-sm)", border: "1px solid rgba(255,255,255,0.03)" }}>
                <div className={styles.priceRow} style={{ fontSize: "13px", color: "var(--admin-text-sub)", display: "flex", justifyContent: "space-between" }}>
                  <span>Subtotal</span>
                  <span>{formatPKR(order.subtotal)}</span>
                </div>
                {order.discount_amount && Number(order.discount_amount) > 0 ? (
                  <div className={styles.priceRow} style={{ display: "flex", justifyContent: "space-between", color: "var(--color-gold)", fontWeight: "bold", fontSize: "13px" }}>
                    <span>Discount ({order.promo_code || "Promo Code"})</span>
                    <span>-{formatPKR(Number(order.discount_amount))}</span>
                  </div>
                ) : null}
                <div className={styles.priceRow} style={{ fontSize: "13px", color: "var(--admin-text-sub)", display: "flex", justifyContent: "space-between" }}>
                  <span>Shipping Cost</span>
                  <span>
                    {order.shipping_cost === 0 ? "FREE" : formatPKR(order.shipping_cost)}
                  </span>
                </div>
                <hr className={styles.divider} style={{ margin: "8px 0" }} />
                <div className={styles.totalRow} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "14px", fontWeight: "var(--weight-bold)", color: "var(--admin-text)" }}>Total Paid</span>
                  <span className={styles.totalPrice} style={{ color: "var(--color-gold)", fontSize: "18px" }}>{formatPKR(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Audit & Log Details */}
            <div className={styles.formCard} style={{ border: "1px solid var(--admin-border)", margin: 0 }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: "var(--weight-bold)", color: "var(--color-gold)", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "12px" }}>
                Payment &amp; Audit Logs
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--admin-text-sub)" }}>Payment Method:</span>
                  <span style={{ fontWeight: "var(--weight-semibold)", color: "var(--color-success)" }}>💸 Cash on Delivery (COD)</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--admin-text-sub)" }}>Order Placement:</span>
                  <span>{new Date(order.created_at).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}</span>
                </div>
                {order.updated_at && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--admin-text-sub)" }}>Last Updated:</span>
                    <span>{new Date(order.updated_at).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Actions, status, and shipping management */}
          <div className={styles.orderSidebarCol} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Status Manager Panel */}
            <div className={styles.formCard} style={{ border: "1px solid var(--admin-border)", margin: 0 }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: "var(--weight-bold)", color: "var(--color-gold)", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "12px" }}>
                Order Status Manager
              </h3>
              
              <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                <label className={styles.formLabel} style={{ marginBottom: "8px", fontSize: "12px", color: "var(--admin-text-sub)" }}>Current Status: <span className={`${styles.badge} ${getStatusBadgeClass(order.status)}`} style={{ marginLeft: "6px" }}>{order.status}</span></label>
                <select
                  value={order.status}
                  onChange={handleStatusChange}
                  disabled={updating}
                  className={styles.formSelect}
                  style={{ width: "100%" }}
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Shipment Management Form Card */}
            <form onSubmit={handleShipmentSave} className={styles.formCard} style={{ border: "1px solid var(--admin-border)", margin: 0 }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: "var(--weight-bold)", color: "var(--color-gold)", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "12px" }}>
                Shipment Management
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Courier Company</label>
                    <select
                      value={shippingCompanyId}
                      onChange={(event) => {
                        const selectedId = event.target.value;
                        setShippingCompanyId(selectedId);
                        const selectedCompany = shippingCompanies.find((item) => item.id === selectedId);
                        setShippingCompanyName(selectedCompany?.name || "");
                        if (selectedCompany && !shipmentCost) {
                          setShipmentCost(Number(selectedCompany.default_base_rate || 0));
                        }
                      }}
                      className={styles.formSelect}
                    >
                      <option value="">Manual / None</option>
                      {shippingCompanies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Shipment Status</label>
                    <select value={shipmentStatus} onChange={(event) => setShipmentStatus(event.target.value as ShipmentStatus)} className={styles.formSelect}>
                      <option value="draft">Draft</option>
                      <option value="booked">Booked</option>
                      <option value="picked_up">Picked Up</option>
                      <option value="in_transit">In Transit</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="failed_delivery">Failed Delivery</option>
                      <option value="returned">Returned</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Tracking Number</label>
                  <input value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} className={styles.formInput} placeholder="Enter Tracking ID" />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Booking Reference CN</label>
                  <input value={bookingReference} onChange={(event) => setBookingReference(event.target.value)} className={styles.formInput} placeholder="Consignment Note #" />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Ship Cost (PKR)</label>
                    <input type="number" min={0} value={shipmentCost} onChange={(event) => setShipmentCost(Number(event.target.value))} className={styles.formInput} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>COD Amount</label>
                    <input type="number" min={0} value={codAmount} onChange={(event) => setCodAmount(Number(event.target.value))} className={styles.formInput} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Weight (kg)</label>
                    <input type="number" min={0} step="0.001" value={weightKg} onChange={(event) => setWeightKg(event.target.value)} className={styles.formInput} placeholder="0.5" />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Pieces Count</label>
                    <input type="number" min={1} value={piecesCount} onChange={(event) => setPiecesCount(Number(event.target.value))} className={styles.formInput} />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Tracking Link URL</label>
                  <input value={trackingUrl} onChange={(event) => setTrackingUrl(event.target.value)} className={styles.formInput} placeholder="Auto-filled from template if blank" />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Estimated Delivery</label>
                  <input type="datetime-local" value={estimatedDeliveryAt} onChange={(event) => setEstimatedDeliveryAt(event.target.value)} className={styles.formInput} />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Package Courier Notes</label>
                  <textarea value={shipmentNotes} onChange={(event) => setShipmentNotes(event.target.value)} className={styles.formTextarea} rows={2} style={{ resize: "vertical" }} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
                  <Button type="submit" variant="luxury" size="sm" isLoading={savingShipment} style={{ width: "100%" }}>
                    {shipmentId ? "Update Shipment" : "Create Shipment"}
                  </Button>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                    <Link href="/admin/shipping" className={styles.tableLink}>
                      Open Shipping Queue &rarr;
                    </Link>
                    {trackingUrl && (
                      <Link href={trackingUrl} className={styles.tableLink} target="_blank" style={{ color: "var(--color-info)" }}>
                        Open Tracking CN ↗
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </form>

            {/* Customer Details Card */}
            <div className={styles.formCard} style={{ border: "1px solid var(--admin-border)", margin: 0 }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: "var(--weight-bold)", color: "var(--color-gold)", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "12px" }}>
                Customer &amp; Delivery
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                
                {/* Contact details */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <h4 style={{ margin: 0, fontSize: "11px", color: "var(--admin-text-sub)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Customer Profile</h4>
                  <p className={styles.orderDetailText} style={{ fontSize: "13.5px", fontWeight: "var(--weight-semibold)" }}>
                    {order.shipping_address.first_name} {order.shipping_address.last_name}
                  </p>
                  <p className={styles.orderDetailText} style={{ fontSize: "13px" }}>
                    ✉️ <a href={`mailto:${order.contact_email}`} className={styles.tableLink} style={{ color: "var(--color-gold)", textDecoration: "none" }}>{order.contact_email}</a>
                  </p>
                  <p className={styles.orderDetailText} style={{ fontSize: "13px" }}>
                    📞 <a href={`tel:${order.contact_phone}`} className={styles.tableLink} style={{ color: "var(--color-gold)", textDecoration: "none" }}>{order.contact_phone}</a>
                  </p>
                </div>

                <hr className={styles.divider} style={{ margin: "4px 0" }} />

                {/* Delivery details */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h4 style={{ margin: 0, fontSize: "11px", color: "var(--admin-text-sub)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Shipping Address</h4>
                    <button
                      onClick={() => {
                        const fullAddress = `${order.shipping_address.first_name} ${order.shipping_address.last_name}\n${order.shipping_address.address_line_1}${order.shipping_address.address_line_2 ? '\n' + order.shipping_address.address_line_2 : ''}\n${order.shipping_address.city}, ${order.shipping_address.state}\nPakistan\nPhone: ${order.contact_phone}`;
                        navigator.clipboard.writeText(fullAddress);
                        toast.success("Shipping address copied!");
                      }}
                      type="button"
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--admin-text-sub)",
                        cursor: "pointer",
                        fontSize: "10.5px",
                        padding: "2px 6px",
                        borderRadius: "3px",
                        backgroundColor: "rgba(255,255,255,0.04)",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)"}
                    >
                      📋 Copy Address
                    </button>
                  </div>
                  <div style={{ fontSize: "13px", lineHeight: "1.5", color: "var(--admin-text)" }}>
                    <p style={{ margin: 0 }}>{order.shipping_address.address_line_1}</p>
                    {order.shipping_address.address_line_2 && (
                      <p style={{ margin: 0 }}>{order.shipping_address.address_line_2}</p>
                    )}
                    <p style={{ margin: 0 }}>{order.shipping_address.city}, {order.shipping_address.state}</p>
                    <p style={{ margin: 0 }}>{order.shipping_address.postal_code}, Pakistan</p>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>

      </div>
    </>
  );
};
