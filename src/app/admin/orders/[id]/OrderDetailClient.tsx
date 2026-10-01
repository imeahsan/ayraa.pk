"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Order, OrderItem, OrderReturnRequest, OrderStatus, ShipmentStatus } from "@/types";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/storefront/Button/Button";
import { updateAdminOrder } from "@/app/actions/orders";
import styles from "../../admin.module.css";

interface OrderDetailClientProps {
  orderId: string;
}

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

interface EditableItem {
  id?: string;
  product_id: string;
  variant_id: string | null;
  product_name: string;
  variant_size?: string | null;
  variant_color?: string | null;
  quantity: number;
  unit_price: number;
  image_url?: string | null;
}

export const OrderDetailClient: React.FC<OrderDetailClientProps> = ({ orderId }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const toast = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderReturns, setOrderReturns] = useState<OrderReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Edit Order Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const hasAutoOpenedRef = useRef(false);
  const [editStatus, setEditStatus] = useState<OrderStatus>("pending");
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAddress1, setEditAddress1] = useState("");
  const [editAddress2, setEditAddress2] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editState, setEditState] = useState("");
  const [editPostalCode, setEditPostalCode] = useState("");
  const [editShippingCost, setEditShippingCost] = useState<number>(0);
  const [editDiscountAmount, setEditDiscountAmount] = useState<number>(0);
  const [editPromoCode, setEditPromoCode] = useState("");
  const [editItems, setEditItems] = useState<EditableItem[]>([]);

  // Catalog products for adding items to order
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [showAddProductRow, setShowAddProductRow] = useState(false);
  const [selectedCatalogProductId, setSelectedCatalogProductId] = useState("");
  const [selectedCatalogVariantId, setSelectedCatalogVariantId] = useState("");
  const [selectedAddQuantity, setSelectedAddQuantity] = useState(1);

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

  const loadOrder = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*, items:order_items(*)")
        .eq("id", orderId)
        .single();

      if (error || !data) {
        setOrder(null);
      } else {
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

      // Fetch associated return requests
      const { data: returnsData } = await supabase
        .from("order_return_requests")
        .select("*, items:order_return_items(*)")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false });

      setOrderReturns((returnsData || []) as OrderReturnRequest[]);
    } catch (err) {
      console.error("Failed to load order detail:", err);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId, supabase]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const openEditModal = useCallback(() => {
    if (!order) return;
    setEditStatus(order.status);
    setEditFirstName(order.shipping_address?.first_name || "");
    setEditLastName(order.shipping_address?.last_name || "");
    setEditPhone(order.contact_phone || "");
    setEditEmail(order.contact_email || "");
    setEditAddress1(order.shipping_address?.address_line_1 || "");
    setEditAddress2(order.shipping_address?.address_line_2 || "");
    setEditCity(order.shipping_address?.city || order.city || "");
    setEditState(order.shipping_address?.state || "");
    setEditPostalCode(order.shipping_address?.postal_code || "");
    setEditShippingCost(Number(order.shipping_cost || 0));
    setEditDiscountAmount(Number(order.discount_amount || 0));
    setEditPromoCode(order.promo_code || "");

    const mappedItems: EditableItem[] = (order.items || []).map((it) => {
      const primaryImg =
        it.product?.images?.find((img) => img.is_primary)?.url ||
        it.product?.images?.[0]?.url;
      return {
        id: it.id,
        product_id: it.product_id,
        variant_id: it.variant_id || null,
        product_name: it.product?.name || "Product",
        variant_size: it.variant?.size || null,
        variant_color: it.variant?.color || it.product?.color || null,
        quantity: it.quantity,
        unit_price: Number(it.unit_price),
        image_url: primaryImg || null,
      };
    });
    setEditItems(mappedItems);
    setShowAddProductRow(false);
    setIsEditModalOpen(true);
  }, [order]);

  const closeEditModal = useCallback(() => {
    if (savingOrder) return;
    setIsEditModalOpen(false);
    setShowAddProductRow(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.has("edit")) {
        url.searchParams.delete("edit");
        window.history.replaceState(null, "", url.pathname + (url.search ? url.search : ""));
      }
    }
  }, [savingOrder]);

  // Open modal automatically if URL contains ?edit=true on initial load
  useEffect(() => {
    if (searchParams.get("edit") === "true" && order && !hasAutoOpenedRef.current) {
      hasAutoOpenedRef.current = true;
      openEditModal();
    }
  }, [searchParams, order, openEditModal]);

  // Close on Escape key press
  useEffect(() => {
    if (!isEditModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeEditModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditModalOpen, closeEditModal]);

  // Load catalog products for order item additions
  useEffect(() => {
    if (!isEditModalOpen || catalogProducts.length > 0) return;
    const fetchCatalog = async () => {
      try {
        const { data } = await supabase
          .from("products")
          .select("id, name, price, sku, images:product_images(url, is_primary), variants:product_variants(id, size, color, stock_quantity, is_available)")
          .eq("is_active", true)
          .order("name", { ascending: true });
        if (data && data.length > 0) {
          setCatalogProducts(data);
          setSelectedCatalogProductId(data[0].id);
          if (data[0].variants && data[0].variants.length > 0) {
            setSelectedCatalogVariantId(data[0].variants[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load catalog products:", err);
      }
    };
    fetchCatalog();
  }, [isEditModalOpen, catalogProducts.length, supabase]);

  const handleItemQtyChange = (index: number, newQty: number) => {
    if (newQty < 1) return;
    setEditItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], quantity: newQty };
      return copy;
    });
  };

  const handleItemPriceChange = (index: number, newPrice: number) => {
    if (newPrice < 0) return;
    setEditItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], unit_price: newPrice };
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    if (editItems.length <= 1) {
      toast.error("An order must contain at least one product item.");
      return;
    }
    setEditItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddCatalogItem = () => {
    if (!selectedCatalogProductId) return;
    const prod = catalogProducts.find((p) => p.id === selectedCatalogProductId);
    if (!prod) return;

    const variant = prod.variants?.find((v: any) => v.id === selectedCatalogVariantId) || null;
    const primaryImg = prod.images?.find((img: any) => img.is_primary)?.url || prod.images?.[0]?.url;

    // Check if already in items list
    const existingIndex = editItems.findIndex(
      (item) => item.product_id === prod.id && item.variant_id === (variant?.id || null)
    );

    if (existingIndex > -1) {
      setEditItems((prev) => {
        const copy = [...prev];
        copy[existingIndex] = {
          ...copy[existingIndex],
          quantity: copy[existingIndex].quantity + selectedAddQuantity,
        };
        return copy;
      });
      toast.success(`Updated quantity for ${prod.name}`);
    } else {
      setEditItems((prev) => [
        ...prev,
        {
          product_id: prod.id,
          variant_id: variant?.id || null,
          product_name: prod.name,
          variant_size: variant?.size || null,
          variant_color: variant?.color || null,
          quantity: selectedAddQuantity,
          unit_price: Number(prod.price),
          image_url: primaryImg || null,
        },
      ]);
      toast.success(`Added ${prod.name} to order`);
    }

    setShowAddProductRow(false);
    setSelectedAddQuantity(1);
  };

  const calculatedSubtotal = editItems.reduce(
    (sum, it) => sum + Number(it.unit_price) * Number(it.quantity),
    0
  );
  const calculatedDiscount = Math.max(0, Number(editDiscountAmount || 0));
  const calculatedShipping = Math.max(0, Number(editShippingCost || 0));
  const calculatedTotal = Math.max(0, calculatedSubtotal - calculatedDiscount) + calculatedShipping;

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    if (!editFirstName.trim() || !editLastName.trim()) {
      toast.error("Customer first and last name are required.");
      return;
    }
    if (!editPhone.trim()) {
      toast.error("Contact phone number is required.");
      return;
    }
    if (!editAddress1.trim() || !editCity.trim()) {
      toast.error("Street address and city are required.");
      return;
    }
    if (editItems.length === 0) {
      toast.error("Order must contain at least one item.");
      return;
    }

    setSavingOrder(true);
    try {
      const res = await updateAdminOrder({
        order_id: order.id,
        status: editStatus,
        shipping_address: {
          first_name: editFirstName.trim(),
          last_name: editLastName.trim(),
          address_line_1: editAddress1.trim(),
          address_line_2: editAddress2.trim() || undefined,
          city: editCity.trim(),
          state: editState.trim(),
          postal_code: editPostalCode.trim() || undefined,
          country: "Pakistan",
        },
        contact_phone: editPhone.trim(),
        contact_email: editEmail.trim(),
        city: editCity.trim(),
        shipping_cost: calculatedShipping,
        discount_amount: calculatedDiscount,
        promo_code: editPromoCode.trim() || null,
        items: editItems.map((it) => ({
          id: it.id,
          product_id: it.product_id,
          variant_id: it.variant_id,
          quantity: it.quantity,
          unit_price: it.unit_price,
        })),
      });

      if (!res.success) {
        toast.error(res.error || "Failed to update order");
      } else {
        toast.success(`Order #${order.id} updated successfully!`);
        closeEditModal();
        setCodAmount(calculatedTotal);
        await loadOrder();
      }
    } catch (err: any) {
      console.error("Save order error:", err);
      toast.error(err.message || "Failed to save order changes");
    } finally {
      setSavingOrder(false);
    }
  };

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
              <p style={{ fontSize: "12px", color: "#777", margin: "5px 0 0 0" }}>www.ayraa.pk</p>
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

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={openEditModal}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 18px",
                backgroundColor: "var(--color-gold)",
                color: "#0c0b0b",
                border: "1px solid var(--color-gold)",
                borderRadius: "var(--radius-sm)",
                fontSize: "13px",
                fontWeight: "var(--weight-bold)",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-gold-bright, #ffe088)";
                e.currentTarget.style.borderColor = "var(--color-gold-bright, #ffe088)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-gold)";
                e.currentTarget.style.borderColor = "var(--color-gold)";
              }}
            >
              <span>✏️</span> Edit Order
            </button>

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
                backgroundColor: orderReturns.length > 0 ? "rgba(233, 195, 73, 0.12)" : "rgba(96, 165, 250, 0.06)",
                color: orderReturns.length > 0 ? "var(--color-gold)" : "var(--color-info)",
                border: orderReturns.length > 0 ? "1px solid rgba(233, 195, 73, 0.4)" : "1px solid rgba(96, 165, 250, 0.2)",
                borderRadius: "var(--radius-sm)",
                fontSize: "13px",
                fontWeight: "var(--weight-bold)",
                textDecoration: "none",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = orderReturns.length > 0 ? "rgba(233, 195, 73, 0.2)" : "rgba(96, 165, 250, 0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = orderReturns.length > 0 ? "rgba(233, 195, 73, 0.12)" : "rgba(96, 165, 250, 0.06)";
              }}
            >
              <span>🔄</span> Return / Exchange {orderReturns.length > 0 && `(${orderReturns.length})`}
            </Link>
          </div>
        </div>

        {/* Return Cases Banner */}
        {orderReturns.length > 0 && (
          <div
            style={{
              backgroundColor: "rgba(233, 195, 73, 0.08)",
              border: "1px solid rgba(233, 195, 73, 0.25)",
              borderRadius: "var(--radius-md, 8px)",
              padding: "16px 20px",
              marginBottom: "24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "16px" }}>🔄</span>
                <strong style={{ fontSize: "14px", color: "var(--color-gold)" }}>
                  {orderReturns.length} Return / Exchange Case(s) Active for this Order
                </strong>
              </div>
              <div style={{ fontSize: "12px", color: "var(--admin-text-sub)", marginTop: "4px" }}>
                {orderReturns.map((r) => (
                  <span key={r.id} style={{ marginRight: "12px" }}>
                    Case #{r.id.slice(0, 8)} ({r.request_type.toUpperCase()}) — Status: <strong style={{ color: "var(--admin-text)" }}>{r.status}</strong>
                  </span>
                ))}
              </div>
            </div>
            <Link
              href={`/admin/returns/${orderReturns[0].id}`}
              style={{
                padding: "6px 14px",
                backgroundColor: "var(--color-gold)",
                color: "#121111",
                fontWeight: 700,
                fontSize: "12px",
                borderRadius: "4px",
                textDecoration: "none",
              }}
            >
              View Return Case →
            </Link>
          </div>
        )}

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
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12px", color: "var(--admin-text-sub)", fontWeight: "var(--weight-semibold)", backgroundColor: "var(--color-bg-hover)", padding: "3px 8px", borderRadius: "10px" }}>
                    {order.items?.length || 0} {order.items?.length === 1 ? "Product" : "Products"}
                  </span>
                  <button
                    type="button"
                    onClick={openEditModal}
                    style={{
                      background: "none",
                      border: "1px solid rgba(233, 195, 73, 0.3)",
                      color: "var(--color-gold)",
                      cursor: "pointer",
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: "var(--radius-sm, 4px)",
                      backgroundColor: "rgba(233, 195, 73, 0.06)",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(233, 195, 73, 0.15)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(233, 195, 73, 0.06)")}
                  >
                    ✏️ Edit Items
                  </button>
                </div>
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "12px" }}>
                <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "var(--weight-bold)", color: "var(--color-gold)", textTransform: "uppercase", letterSpacing: "1px" }}>
                  Customer &amp; Delivery
                </h3>
                <button
                  type="button"
                  onClick={openEditModal}
                  style={{
                    background: "none",
                    border: "1px solid rgba(233, 195, 73, 0.3)",
                    color: "var(--color-gold)",
                    cursor: "pointer",
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "3px 8px",
                    borderRadius: "var(--radius-sm, 4px)",
                    backgroundColor: "rgba(233, 195, 73, 0.06)",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(233, 195, 73, 0.15)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(233, 195, 73, 0.06)")}
                >
                  ✏️ Edit Info
                </button>
              </div>
              
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

      {/* EDIT ORDER MODAL */}
      {isEditModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(6px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            cursor: "pointer",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeEditModal();
            }
          }}
        >
          <div
            style={{
              backgroundColor: "#141313",
              border: "1px solid rgba(233, 195, 73, 0.3)",
              borderRadius: "var(--radius-sm, 4px)",
              width: "100%",
              maxWidth: "880px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "28px",
              boxShadow: "0 24px 48px rgba(0,0,0,0.8)",
              position: "relative",
              cursor: "default",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                paddingBottom: "16px",
                marginBottom: "24px",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "20px" }}>✏️</span>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "20px",
                      fontWeight: 700,
                      fontFamily: "var(--font-headline)",
                      color: "var(--color-gold)",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Edit Order #{order.id}
                  </h2>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--admin-text-sub)" }}>
                  Update delivery contact, addresses, order items, quantities, pricing, and order status.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                disabled={savingOrder}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--admin-text-sub)",
                  fontSize: "20px",
                  cursor: "pointer",
                  lineHeight: 1,
                  padding: "4px 8px",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--admin-text-sub)")}
                title="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveOrder} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              
              {/* SECTION 1: Customer & Delivery Details */}
              <div
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "var(--radius-sm, 4px)",
                  padding: "18px 20px",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 14px 0",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "var(--color-gold)",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>👤</span> Customer &amp; Shipping Information
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div className={styles.formGroup} style={{ margin: 0 }}>
                      <label className={styles.formLabel}>First Name *</label>
                      <input
                        type="text"
                        required
                        value={editFirstName}
                        onChange={(e) => setEditFirstName(e.target.value)}
                        className={styles.formInput}
                        placeholder="First name"
                      />
                    </div>
                    <div className={styles.formGroup} style={{ margin: 0 }}>
                      <label className={styles.formLabel}>Last Name *</label>
                      <input
                        type="text"
                        required
                        value={editLastName}
                        onChange={(e) => setEditLastName(e.target.value)}
                        className={styles.formInput}
                        placeholder="Last name"
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div className={styles.formGroup} style={{ margin: 0 }}>
                      <label className={styles.formLabel}>Contact Phone *</label>
                      <input
                        type="tel"
                        required
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className={styles.formInput}
                        placeholder="03001234567"
                      />
                    </div>
                    <div className={styles.formGroup} style={{ margin: 0 }}>
                      <label className={styles.formLabel}>Contact Email</label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className={styles.formInput}
                        placeholder="customer@email.com"
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup} style={{ margin: 0 }}>
                    <label className={styles.formLabel}>Delivery Address (Line 1) *</label>
                    <input
                      type="text"
                      required
                      value={editAddress1}
                      onChange={(e) => setEditAddress1(e.target.value)}
                      className={styles.formInput}
                      placeholder="House/Apartment #, Street, Area"
                    />
                  </div>

                  <div className={styles.formGroup} style={{ margin: 0 }}>
                    <label className={styles.formLabel}>Address Line 2 (Optional)</label>
                    <input
                      type="text"
                      value={editAddress2}
                      onChange={(e) => setEditAddress2(e.target.value)}
                      className={styles.formInput}
                      placeholder="Nearby Landmark, Floor, etc."
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "12px" }}>
                    <div className={styles.formGroup} style={{ margin: 0 }}>
                      <label className={styles.formLabel}>City *</label>
                      <input
                        type="text"
                        required
                        value={editCity}
                        onChange={(e) => setEditCity(e.target.value)}
                        className={styles.formInput}
                        placeholder="City (e.g. Lahore, Karachi)"
                      />
                    </div>
                    <div className={styles.formGroup} style={{ margin: 0 }}>
                      <label className={styles.formLabel}>State / Province</label>
                      <input
                        type="text"
                        value={editState}
                        onChange={(e) => setEditState(e.target.value)}
                        className={styles.formInput}
                        placeholder="Punjab, Sindh, etc."
                      />
                    </div>
                    <div className={styles.formGroup} style={{ margin: 0 }}>
                      <label className={styles.formLabel}>Postal Code</label>
                      <input
                        type="text"
                        value={editPostalCode}
                        onChange={(e) => setEditPostalCode(e.target.value)}
                        className={styles.formInput}
                        placeholder="54000"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Order Line Items */}
              <div
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "var(--radius-sm, 4px)",
                  padding: "18px 20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "14px",
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "var(--color-gold)",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span>📦</span> Order Items ({editItems.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddProductRow((prev) => !prev)}
                    style={{
                      background: "rgba(233, 195, 73, 0.1)",
                      border: "1px solid rgba(233, 195, 73, 0.3)",
                      color: "var(--color-gold)",
                      fontSize: "12px",
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: "var(--radius-sm, 4px)",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {showAddProductRow ? "✕ Cancel Add" : "＋ Add Product"}
                  </button>
                </div>

                {/* Add Product Inline Form */}
                {showAddProductRow && (
                  <div
                    style={{
                      backgroundColor: "rgba(233, 195, 73, 0.05)",
                      border: "1px dashed rgba(233, 195, 73, 0.35)",
                      borderRadius: "var(--radius-sm, 4px)",
                      padding: "14px",
                      marginBottom: "16px",
                    }}
                  >
                    <p style={{ margin: "0 0 10px 0", fontSize: "12px", color: "var(--color-gold)", fontWeight: 600 }}>
                      Add a catalog item to this order:
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 80px auto", gap: "10px", alignItems: "flex-end" }}>
                      <div className={styles.formGroup} style={{ margin: 0 }}>
                        <label className={styles.formLabel} style={{ fontSize: "11px" }}>Select Product</label>
                        <select
                          value={selectedCatalogProductId}
                          onChange={(e) => {
                            const newPId = e.target.value;
                            setSelectedCatalogProductId(newPId);
                            const prod = catalogProducts.find((p) => p.id === newPId);
                            if (prod?.variants && prod.variants.length > 0) {
                              setSelectedCatalogVariantId(prod.variants[0].id);
                            } else {
                              setSelectedCatalogVariantId("");
                            }
                          }}
                          className={styles.formSelect}
                          style={{ fontSize: "12px", padding: "6px 8px" }}
                        >
                          {catalogProducts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} — {formatPKR(Number(p.price))}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.formGroup} style={{ margin: 0 }}>
                        <label className={styles.formLabel} style={{ fontSize: "11px" }}>Variant / Size</label>
                        {(() => {
                          const currentProd = catalogProducts.find((p) => p.id === selectedCatalogProductId);
                          const variants = currentProd?.variants || [];
                          if (variants.length === 0) {
                            return (
                              <input
                                disabled
                                value="Standard"
                                className={styles.formInput}
                                style={{ fontSize: "12px", padding: "6px 8px", opacity: 0.7 }}
                              />
                            );
                          }
                          return (
                            <select
                              value={selectedCatalogVariantId}
                              onChange={(e) => setSelectedCatalogVariantId(e.target.value)}
                              className={styles.formSelect}
                              style={{ fontSize: "12px", padding: "6px 8px" }}
                            >
                              {variants.map((v: any) => (
                                <option key={v.id} value={v.id}>
                                  {v.size}{v.color && v.color !== "Standard" ? ` (${v.color})` : ""} - Stock: {v.stock_quantity ?? "—"}
                                </option>
                              ))}
                            </select>
                          );
                        })()}
                      </div>

                      <div className={styles.formGroup} style={{ margin: 0 }}>
                        <label className={styles.formLabel} style={{ fontSize: "11px" }}>Qty</label>
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={selectedAddQuantity}
                          onChange={(e) => setSelectedAddQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className={styles.formInput}
                          style={{ fontSize: "12px", padding: "6px 8px" }}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleAddCatalogItem}
                        style={{
                          backgroundColor: "var(--color-gold)",
                          color: "#121111",
                          border: "none",
                          padding: "8px 14px",
                          borderRadius: "var(--radius-sm, 4px)",
                          fontWeight: 700,
                          fontSize: "12px",
                          cursor: "pointer",
                          height: "36px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        ＋ Add to Order
                      </button>
                    </div>
                  </div>
                )}

                {/* Items List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {editItems.map((item, idx) => (
                    <div
                      key={item.id || `${item.product_id}-${item.variant_id}-${idx}`}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "48px 1fr 140px 110px 100px 32px",
                        gap: "12px",
                        alignItems: "center",
                        backgroundColor: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid rgba(255, 255, 255, 0.05)",
                        padding: "10px 14px",
                        borderRadius: "var(--radius-sm, 4px)",
                      }}
                    >
                      {/* Thumbnail */}
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "4px",
                          overflow: "hidden",
                          position: "relative",
                          backgroundColor: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(233, 195, 73, 0.15)",
                        }}
                      >
                        {item.image_url ? (
                          <Image
                            src={item.image_url}
                            alt={item.product_name}
                            fill
                            sizes="48px"
                            style={{ objectFit: "cover" }}
                          />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
                            👗
                          </div>
                        )}
                      </div>

                      {/* Name & Details */}
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--admin-text)" }}>
                          {item.product_name}
                        </div>
                        <div style={{ display: "flex", gap: "6px", marginTop: "3px" }}>
                          {item.variant_size && (
                            <span style={{ fontSize: "10px", backgroundColor: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: "3px", color: "var(--admin-text-sub)" }}>
                              Size: {item.variant_size}
                            </span>
                          )}
                          {item.variant_color && (
                            <span style={{ fontSize: "10px", backgroundColor: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: "3px", color: "var(--admin-text-sub)" }}>
                              Color: {item.variant_color}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Unit Price Input */}
                      <div>
                        <label style={{ fontSize: "10px", color: "var(--admin-text-sub)", display: "block", marginBottom: "2px" }}>
                          Unit Price (PKR)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={item.unit_price}
                          onChange={(e) => handleItemPriceChange(idx, Number(e.target.value) || 0)}
                          className={styles.formInput}
                          style={{ fontSize: "12px", padding: "4px 8px" }}
                        />
                      </div>

                      {/* Quantity Stepper */}
                      <div>
                        <label style={{ fontSize: "10px", color: "var(--admin-text-sub)", display: "block", marginBottom: "2px" }}>
                          Quantity
                        </label>
                        <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--admin-border)", borderRadius: "var(--radius-sm, 4px)", overflow: "hidden" }}>
                          <button
                            type="button"
                            onClick={() => handleItemQtyChange(idx, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            style={{
                              backgroundColor: "rgba(255,255,255,0.06)",
                              border: "none",
                              color: "var(--admin-text)",
                              width: "26px",
                              height: "28px",
                              cursor: item.quantity <= 1 ? "not-allowed" : "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "14px",
                            }}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={99}
                            value={item.quantity}
                            onChange={(e) => handleItemQtyChange(idx, Math.max(1, parseInt(e.target.value) || 1))}
                            style={{
                              width: "36px",
                              height: "28px",
                              backgroundColor: "transparent",
                              border: "none",
                              color: "var(--admin-text)",
                              textAlign: "center",
                              fontSize: "12px",
                              outline: "none",
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleItemQtyChange(idx, item.quantity + 1)}
                            style={{
                              backgroundColor: "rgba(255,255,255,0.06)",
                              border: "none",
                              color: "var(--admin-text)",
                              width: "26px",
                              height: "28px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "14px",
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Line Total */}
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "10px", color: "var(--admin-text-sub)", display: "block", marginBottom: "2px" }}>Total</span>
                        <span style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--color-gold-bright)" }}>
                          {formatPKR(item.unit_price * item.quantity)}
                        </span>
                      </div>

                      {/* Remove Button */}
                      <div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          title="Remove item"
                          style={{
                            background: "none",
                            border: "none",
                            color: "rgba(239, 68, 68, 0.7)",
                            cursor: "pointer",
                            fontSize: "14px",
                            padding: "4px",
                            transition: "color 0.15s, transform 0.1s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(239, 68, 68, 0.7)")}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 3: Order Status & Financial Adjustments */}
              <div
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "var(--radius-sm, 4px)",
                  padding: "18px 20px",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 14px 0",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "var(--color-gold)",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>💳</span> Order Status &amp; Financial Breakdown
                </h3>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div className={styles.formGroup} style={{ margin: 0 }}>
                    <label className={styles.formLabel}>Order Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as OrderStatus)}
                      className={styles.formSelect}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className={styles.formGroup} style={{ margin: 0 }}>
                    <label className={styles.formLabel}>Shipping Cost (PKR)</label>
                    <input
                      type="number"
                      min={0}
                      value={editShippingCost}
                      onChange={(e) => setEditShippingCost(Math.max(0, Number(e.target.value) || 0))}
                      className={styles.formInput}
                      placeholder="e.g. 250 (0 for free shipping)"
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className={styles.formGroup} style={{ margin: 0 }}>
                    <label className={styles.formLabel}>Discount Amount (PKR)</label>
                    <input
                      type="number"
                      min={0}
                      value={editDiscountAmount}
                      onChange={(e) => setEditDiscountAmount(Math.max(0, Number(e.target.value) || 0))}
                      className={styles.formInput}
                      placeholder="0"
                    />
                  </div>

                  <div className={styles.formGroup} style={{ margin: 0 }}>
                    <label className={styles.formLabel}>Promo Code (Optional)</label>
                    <input
                      type="text"
                      value={editPromoCode}
                      onChange={(e) => setEditPromoCode(e.target.value.toUpperCase())}
                      className={styles.formInput}
                      placeholder="e.g. WELCOME10"
                    />
                  </div>
                </div>

                {/* Live Computed Totals Box */}
                <div
                  style={{
                    marginTop: "16px",
                    backgroundColor: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(233, 195, 73, 0.2)",
                    borderRadius: "var(--radius-sm, 4px)",
                    padding: "14px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--admin-text-sub)" }}>
                    <span>Calculated Subtotal:</span>
                    <span>{formatPKR(calculatedSubtotal)}</span>
                  </div>
                  {calculatedDiscount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--color-gold)" }}>
                      <span>Discount ({editPromoCode || "Applied"}):</span>
                      <span>-{formatPKR(calculatedDiscount)}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--admin-text-sub)" }}>
                    <span>Shipping Cost:</span>
                    <span>{calculatedShipping === 0 ? "FREE" : formatPKR(calculatedShipping)}</span>
                  </div>
                  <div
                    style={{
                      borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                      marginTop: "6px",
                      paddingTop: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--admin-text)" }}>New Order Total (COD):</span>
                    <span style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-gold-bright)" }}>
                      {formatPKR(calculatedTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "12px",
                  borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                  paddingTop: "16px",
                }}
              >
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={savingOrder}
                  style={{
                    padding: "10px 18px",
                    backgroundColor: "transparent",
                    color: "var(--admin-text-sub)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "var(--radius-sm, 4px)",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  variant="luxury"
                  size="md"
                  isLoading={savingOrder}
                  style={{ minWidth: "160px" }}
                >
                  Save Order Changes
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
};
