"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { UserProfile } from "@/types";
import styles from "../admin.module.css";

// Fallback Mock Customers
const MOCK_CUSTOMERS: (UserProfile & { orders_count?: number; total_spent?: number })[] = [
  {
    id: "u1",
    email: "zahra@example.com",
    full_name: "Zahra Ahmed",
    phone: "0300-1234567",
    role: "customer",
    created_at: new Date().toISOString(),
    orders_count: 3,
    total_spent: 185000,
  },
  {
    id: "u2",
    email: "fatima@example.com",
    full_name: "Fatima Khan",
    phone: "0321-7654321",
    role: "customer",
    created_at: new Date().toISOString(),
    orders_count: 1,
    total_spent: 85500,
  },
  {
    id: "u3",
    email: "ayesha@example.com",
    full_name: "Ayesha Tariq",
    phone: "0333-9876543",
    role: "customer",
    created_at: new Date().toISOString(),
    orders_count: 5,
    total_spent: 420000,
  },
];

export default function AdminCustomersPage() {
  const supabase = createClient();
  const [customers, setCustomers] = useState<(UserProfile & { orders_count?: number; total_spent?: number })[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("role", "customer")
          .order("created_at", { ascending: false });

        if (error || !data || data.length === 0) {
          setCustomers(MOCK_CUSTOMERS);
        } else {
          // Resolve order count & total spent for each profile
          const resolved = await Promise.all(
            data.map(async (profile) => {
              const { data: oData } = await supabase
                .from("orders")
                .select("total")
                .eq("user_id", profile.id);

              const count = oData?.length || 0;
              const total = oData?.reduce((acc, order) => acc + order.total, 0) || 0;

              return {
                ...profile,
                orders_count: count,
                total_spent: total,
              };
            })
          );
          setCustomers(resolved as any[]);
        }
      } catch (err) {
        console.error("Failed to load customers:", err);
        setCustomers(MOCK_CUSTOMERS);
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
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
                        <span className={styles.tableTdHighlight}>
                          {c.full_name || "Guest Customer"}
                        </span>
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
