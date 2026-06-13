import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardStats, TopSellingProduct, Order, OrderStatus } from "@/types";
import styles from "./admin.module.css";

export const dynamic = "force-dynamic";

// Mocks for Dashboard Stats
const MOCK_STATS: DashboardStats = {
  total_revenue: 2450000,
  revenue_change: 12,
  orders_today: 24,
  orders_change: 8,
  total_products: 156,
  active_customers: 1240,
};

const MOCK_TOP_PRODUCTS: TopSellingProduct[] = [
  {
    product_id: "p1",
    product_name: "Midnight Chiffon Suit",
    image_url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=100&auto=format&fit=crop&q=80",
    units_sold: 42,
    revenue: 8400000,
  },
  {
    product_id: "p2",
    product_name: "Ivory Drape Dress",
    image_url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=100&auto=format&fit=crop&q=80",
    units_sold: 28,
    revenue: 4200000,
  },
  {
    product_id: "p3",
    product_name: "Olive Linen Set",
    image_url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=100&auto=format&fit=crop&q=80",
    units_sold: 65,
    revenue: 3900000,
  },
];

const MOCK_ORDERS: Order[] = [
  {
    id: "AYR-00142",
    user_id: null,
    status: "processing" as OrderStatus,
    payment_method: "cod",
    subtotal: 145000,
    shipping_cost: 0,
    total: 145000,
    shipping_address: {
      first_name: "Zahra",
      last_name: "Ahmed",
      address_line_1: "Block 5, Clifton",
      city: "Karachi",
      state: "Sindh",
      postal_code: "75500",
      country: "Pakistan",
    },
    contact_phone: "0300-1234567",
    contact_email: "zahra@example.com",
    city: "Karachi",
    created_at: new Date().toISOString(),
  },
  {
    id: "AYR-00141",
    user_id: null,
    status: "shipped" as OrderStatus,
    payment_method: "cod",
    subtotal: 85500,
    shipping_cost: 0,
    total: 85500,
    shipping_address: {
      first_name: "Fatima",
      last_name: "Khan",
      address_line_1: "DHA Phase 6",
      city: "Lahore",
      state: "Punjab",
      postal_code: "54000",
      country: "Pakistan",
    },
    contact_phone: "0321-7654321",
    contact_email: "fatima@example.com",
    city: "Lahore",
    created_at: new Date().toISOString(),
  },
  {
    id: "AYR-00140",
    user_id: null,
    status: "delivered" as OrderStatus,
    payment_method: "cod",
    subtotal: 210000,
    shipping_cost: 0,
    total: 210000,
    shipping_address: {
      first_name: "Ayesha",
      last_name: "Tariq",
      address_line_1: "F-7/2",
      city: "Islamabad",
      state: "Islamabad",
      postal_code: "44000",
      country: "Pakistan",
    },
    contact_phone: "0333-9876543",
    contact_email: "ayesha@example.com",
    city: "Islamabad",
    created_at: new Date().toISOString(),
  },
];

export default async function AdminDashboardPage() {
  let stats: DashboardStats = MOCK_STATS;
  let topProducts: TopSellingProduct[] = MOCK_TOP_PRODUCTS;
  let recentOrders: Order[] = MOCK_ORDERS;

  try {
    const supabase = await createClient();

    // Fetch dynamic recent orders
    const { data: ordersData } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    if (ordersData && ordersData.length > 0) {
      recentOrders = ordersData as Order[];
    }
  } catch (err) {
    console.error("Error loading dashboard stats from Supabase:", err);
  }

  const formatPKR = (amount: number) => {
    return Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount);
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

  return (
    <div className={styles.pageLayout}>
      {/* 1. Stats Row */}
      <div className={styles.dashboardGrid}>
        {/* Card 1 */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={`${styles.cardIcon} ${styles.cardIconGold}`}>💼</div>
            <span className={`${styles.changeBadge} ${styles.changeBadgeUp}`}>
              📈 +{stats.revenue_change}%
            </span>
          </div>
          <div className={styles.cardMeta}>
            <span className={styles.cardLabel}>Total Revenue</span>
            <h3 className={styles.cardValue}>{formatPKR(stats.total_revenue)}</h3>
          </div>
        </div>

        {/* Card 2 */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={`${styles.cardIcon} ${styles.cardIconMuted}`}>🛒</div>
            <span className={`${styles.changeBadge} ${styles.changeBadgeUp}`}>
              📈 +{stats.orders_change}%
            </span>
          </div>
          <div className={styles.cardMeta}>
            <span className={styles.cardLabel}>Orders Today</span>
            <h3 className={styles.cardValue}>{stats.orders_today}</h3>
          </div>
        </div>

        {/* Card 3 */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={`${styles.cardIcon} ${styles.cardIconMuted}`}>👗</div>
          </div>
          <div className={styles.cardMeta}>
            <span className={styles.cardLabel}>Total Products</span>
            <h3 className={styles.cardValue}>{stats.total_products}</h3>
          </div>
        </div>

        {/* Card 4 */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={`${styles.cardIcon} ${styles.cardIconMuted}`}>👥</div>
          </div>
          <div className={styles.cardMeta}>
            <span className={styles.cardLabel}>Active Customers</span>
            <h3 className={styles.cardValue}>{stats.active_customers.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* 2. Visual Graphs Section */}
      <div className={styles.chartSection}>
        {/* Revenue SVG Sparkline Chart */}
        <div className={styles.sparklineChartCard}>
          <h3 className={styles.chartTitle}>Revenue Overview</h3>
          <div className="w-full relative">
            <svg viewBox="0 0 500 150" className="w-full h-[150px]">
              {/* Grid Lines */}
              <line x1="0" y1="10" x2="500" y2="10" stroke="#2a2929" strokeWidth="1" />
              <line x1="0" y1="50" x2="500" y2="50" stroke="#2a2929" strokeWidth="1" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="#2a2929" strokeWidth="1" />
              <line x1="0" y1="140" x2="500" y2="140" stroke="#3d3b3b" strokeWidth="1.5" />
              
              {/* Sparkline curve */}
              <path
                d="M 10 120 C 100 80, 150 110, 250 50 C 350 20, 400 90, 480 15"
                fill="none"
                stroke="var(--color-gold)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </svg>
            <div className={styles.sparklineLabels}>
              <span>Week 1</span>
              <span>Week 2</span>
              <span>Week 3</span>
              <span>Week 4</span>
            </div>
          </div>
        </div>

        {/* Donut Orders Chart */}
        <div className={styles.donutChartCard}>
          <h3 className={styles.chartTitle}>Orders by Status</h3>
          <div className={styles.donutContainer}>
            <div className={styles.donutCircle}>
              <div className={styles.donutTextContainer}>
                <span className={styles.donutPercent}>100%</span>
                <span className={styles.donutLabel}>Total</span>
              </div>
            </div>
            <div className={styles.donutLegend}>
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{ backgroundColor: "#2a2929" }} />
                <span>Delivered</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{ backgroundColor: "var(--color-gold)" }} />
                <span>Processing</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{ backgroundColor: "var(--color-border-subtle)" }} />
                <span>Pending</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Tables Section */}
      <div className={styles.tableSection}>
        {/* Recent Orders table */}
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <h3 className={styles.tableTitle}>Recent Orders</h3>
            <Link href="/admin/orders" className={styles.tableLink}>
              View All
            </Link>
          </div>
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.tableTh}>Order ID</th>
                  <th className={styles.tableTh}>Customer</th>
                  <th className={styles.tableTh}>Total</th>
                  <th className={styles.tableTh}>Status</th>
                  <th className={styles.tableTh}>City</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => {
                  return (
                    <tr key={order.id} className={styles.tableTr}>
                      <td className={`${styles.tableTd} ${styles.tableTdHighlight}`}>
                        <Link href={`/admin/orders/${order.id}`} className={styles.tableLink}>{order.id}</Link>
                      </td>
                      <td className={styles.tableTd}>
                        {order.shipping_address.first_name} {order.shipping_address.last_name}
                      </td>
                      <td className={`${styles.tableTd} ${styles.tableTdHighlight}`}>
                        {formatPKR(order.total)}
                      </td>
                      <td className={styles.tableTd}>
                        <span className={`${styles.badge} ${getStatusBadgeClass(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className={styles.tableTd} style={{ textTransform: "capitalize" }}>{order.city}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top products list */}
        <div className={styles.topProductsCard}>
          <h3 className={styles.chartTitle}>Top Products</h3>
          <div className={styles.topProductsList}>
            {topProducts.map((p) => (
              <div key={p.product_id} className={styles.topProductRow}>
                <div
                  className={styles.topProductThumb}
                  style={{ backgroundImage: `url(${p.image_url})` }}
                />
                <div className={styles.topProductDetails}>
                  <h4 className={styles.topProductName}>{p.product_name}</h4>
                  <span className={styles.topProductMeta}>{p.units_sold} units sold</span>
                </div>
                <div className={styles.topProductPrice}>
                  {formatPKR(p.revenue)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
