"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/storefront/Header/Header";
import { Footer } from "@/components/storefront/Footer/Footer";
import { Button } from "@/components/storefront/Button/Button";
import { Breadcrumb } from "@/components/storefront/Breadcrumb/Breadcrumb";
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
}

interface Order {
  id: string;
  user_id: string | null;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  payment_method: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  created_at: string;
  order_items: OrderItem[];
}

export default function CustomerOrdersPage() {
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  const fetchOrders = async (userId: string) => {
    try {
      const { data, error } = await supabase
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
            )
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders((data as any) || []);
    } catch (err) {
      console.error("Failed to load customer orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsLoggedIn(true);
        fetchOrders(user.id);
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

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Header />

      <main className="grow">
        <div className={styles.container}>
          <Breadcrumb items={[{ label: "My Orders", url: "/orders" }]} />

          <h1 className={styles.pageTitle}>My Orders</h1>

          {loading ? (
            <p style={{ fontStyle: "italic", fontSize: "14px", color: "var(--color-on-surface-sub)", textAlign: "center", paddingBlock: "48px" }}>
              Loading your orders history...
            </p>
          ) : isLoggedIn === false ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>Please sign in to view your orders history.</p>
              <Link href={`/login?redirectTo=${encodeURIComponent("/orders")}`}>
                <Button variant="luxury" size="lg">Sign In</Button>
              </Link>
            </div>
          ) : orders.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>You have not placed any orders yet.</p>
              <Link href="/collections/ready-to-wear">
                <Button variant="luxury" size="lg">Start Shopping</Button>
              </Link>
            </div>
          ) : (
            <div>
              {orders.map((order) => (
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
                        <span className={styles.metaValue} style={{ textTransform: "uppercase" }}>{order.payment_method}</span>
                      </div>
                    </div>
                    <div>
                      <span className={`${styles.statusBadge} ${styles[`status-${order.status}`]}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Order Items List */}
                  <div className={styles.itemsList}>
                    {order.order_items.map((item) => {
                      const primaryImg = item.product?.images?.find(img => img.is_primary) || item.product?.images?.[0];
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
                                <Link href={`/product/${item.product.slug}`} className="hover:underline" style={{ color: "inherit", textDecoration: "none" }}>
                                  {item.product.name}
                                </Link>
                              ) : (
                                "Unknown Product"
                              )}
                            </h4>
                            <span className={styles.itemMeta}>
                              Qty: {item.quantity} | Price: {formatPKR(item.unit_price)}
                            </span>
                          </div>
                          <span className={styles.itemPrice}>
                            {formatPKR(item.unit_price * item.quantity)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
