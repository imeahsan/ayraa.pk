"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { UserProfile } from "@/types";
import styles from "../admin.module.css";

// Fallback Mock Customers
export default function AdminCustomersPage() {
  const supabase = createClient();
  const [customers, setCustomers] = useState<(UserProfile & { orders_count?: number; total_spent?: number; is_guest?: boolean })[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        // 1. Fetch registered customer profiles
        const { data: profiles, error: pError } = await supabase
          .from("profiles")
          .select("*")
          .eq("role", "customer");

        // 2. Fetch all orders
        const { data: orders, error: oError } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });

        if (pError || oError) {
          throw new Error(pError?.message || oError?.message || "Failed to load database content");
        }

        const registeredProfiles = (profiles || []) as UserProfile[];
        const allOrders = (orders || []) as any[];

        // Maps to track orders for registered profiles
        const profileOrdersMap: Record<string, any[]> = {};
        registeredProfiles.forEach((p) => {
          profileOrdersMap[p.id] = [];
        });

        // Track guest orders grouped by contact_phone
        const normalizePhone = (ph: string) => ph ? ph.trim().replace(/[^0-9]/g, "") : "";
        const guestOrdersByPhone: Record<string, { phone: string; orders: any[] }> = {};

        allOrders.forEach((order) => {
          // Find matching registered profile (by user_id, email, or normalized phone)
          const matchedProfile = registeredProfiles.find((p) => {
            if (order.user_id && p.id === order.user_id) return true;
            if (order.contact_email && p.email && order.contact_email.toLowerCase() === p.email.toLowerCase()) return true;
            if (order.contact_phone && p.phone && normalizePhone(order.contact_phone) === normalizePhone(p.phone)) return true;
            return false;
          });

          if (matchedProfile) {
            profileOrdersMap[matchedProfile.id].push(order);
          } else if (order.contact_phone) {
            const normPhone = normalizePhone(order.contact_phone);
            if (normPhone) {
              if (!guestOrdersByPhone[normPhone]) {
                guestOrdersByPhone[normPhone] = {
                  phone: order.contact_phone,
                  orders: [],
                };
              }
              guestOrdersByPhone[normPhone].orders.push(order);
            }
          }
        });

        // Map registered profiles to customer format
        const registeredCustomers = registeredProfiles.map((profile) => {
          const profileOrders = profileOrdersMap[profile.id] || [];
          const count = profileOrders.length;
          const total = profileOrders.reduce((acc, o) => acc + Number(o.total), 0);
          return {
            ...profile,
            orders_count: count,
            total_spent: total,
            is_guest: false,
          };
        });

        // Map guest groups to customer format
        const guestCustomers = Object.keys(guestOrdersByPhone).map((normPhone) => {
          const group = guestOrdersByPhone[normPhone];
          const groupOrders = group.orders;
          const count = groupOrders.length;
          const total = groupOrders.reduce((acc, o) => acc + Number(o.total), 0);

          const latestOrder = groupOrders[0];
          const earliestOrder = groupOrders[groupOrders.length - 1];
          const first_name = latestOrder.shipping_address?.first_name || "";
          const last_name = latestOrder.shipping_address?.last_name || "";
          const fullName = [first_name, last_name].filter(Boolean).join(" ") || "Guest Customer";

          return {
            id: `guest-${normPhone}`,
            email: latestOrder.contact_email || "",
            full_name: fullName,
            phone: group.phone,
            role: "customer" as const,
            created_at: earliestOrder.created_at || latestOrder.created_at,
            orders_count: count,
            total_spent: total,
            is_guest: true,
          };
        });

        // Combine and sort by date descending
        const combined = [...registeredCustomers, ...guestCustomers].sort((a, b) => {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        setCustomers(combined);
      } catch (err) {
        console.error("Failed to load customers:", err);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [supabase]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (c) =>
        c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm))
    );
  }, [customers, searchTerm]);

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
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className={styles.pageLayout}>
      <div className={styles.filterContainer}>
        {/* Search Input */}
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search customers by name, email or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {loading ? (
        <p className="font-body text-sm text-admin-text-sub text-center py-12">Loading customers list...</p>
      ) : filteredCustomers.length === 0 ? (
        <div className={styles.tableCard} style={{ padding: "48px", textAlign: "center" }}>
          No customers found matching search.
        </div>
      ) : (
        <div className={styles.tableCard}>
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.tableTh}>Customer Name</th>
                  <th className={styles.tableTh}>Email Address</th>
                  <th className={styles.tableTh}>Phone Number</th>
                  <th className={styles.tableTh} style={{ textAlign: "center" }}>Orders Count</th>
                  <th className={styles.tableTh}>Total Spent</th>
                  <th className={styles.tableTh}>Registered Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className={styles.tableTr}>
                    <td className={styles.tableTd}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "var(--radius-full)", backgroundColor: "var(--admin-bg)", color: "var(--color-gold)", fontWeight: "bold", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--admin-border)" }}>
                          {c.full_name?.charAt(0) || "C"}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span className={styles.tableTdHighlight}>
                            {c.full_name || "Guest Customer"}
                          </span>
                          {c.is_guest && (
                            <span style={{ fontSize: "10px", color: "var(--color-gold)", border: "1px solid var(--color-gold-border)", padding: "1px 6px", borderRadius: "4px", backgroundColor: "var(--color-gold-muted)", width: "fit-content", marginTop: "2px", fontWeight: "bold", textTransform: "uppercase" }}>
                              Guest
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className={styles.tableTd}>{c.email}</td>
                    <td className={styles.tableTd}>{c.phone || "—"}</td>
                    <td className={styles.tableTd} style={{ textAlign: "center", fontWeight: "var(--weight-medium)" }}>{c.orders_count || 0}</td>
                    <td className={`${styles.tableTd} ${styles.tableTdHighlight}`}>
                      {formatPKR(c.total_spent || 0)}
                    </td>
                    <td className={styles.tableTd} style={{ fontSize: "12px" }}>{formatDate(c.created_at)}</td>
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
