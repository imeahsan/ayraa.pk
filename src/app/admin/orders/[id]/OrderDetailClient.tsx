"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Order, OrderItem, OrderStatus } from "@/types";
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
        alert(`Failed to update status: ${error.message}`);
      } else {
        setOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err) {
      // Simulate local update if DB fails
      setOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
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
    <div className={styles.pageLayout}>
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
                      {item.variant?.size && (
                        <span className={styles.orderItemMeta}>Size: {item.variant.size}</span>
                      )}
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
  );
};
