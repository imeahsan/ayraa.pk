"use client";

import React, { useState } from "react";
import { Expense, ExpenseCategory, ExpensePaymentMethod, RecurringInterval } from "@/types";
import { Button } from "@/components/storefront/Button/Button";
import { useToast } from "@/context/ToastContext";
import { createExpense, deleteExpense, updateExpense } from "@/app/actions/finance";
import styles from "../finance.module.css";

interface ExpenseManagerProps {
  expenses: Expense[];
  onRefresh: () => Promise<void>;
}

const CATEGORIES: Array<{ key: ExpenseCategory; label: string; icon: string }> = [
  { key: "marketing_ads", label: "Marketing & Paid Ads", icon: "📣" },
  { key: "fabric_materials", label: "Fabric & Sourcing", icon: "🧵" },
  { key: "packaging_supplies", label: "Packaging & Boxes", icon: "📦" },
  { key: "salaries_wages", label: "Salaries & Wages", icon: "👥" },
  { key: "logistics_shipping", label: "Logistics & Delivery", icon: "🚚" },
  { key: "rent_utilities", label: "Rent & Utilities", icon: "🏢" },
  { key: "software_tools", label: "Software & Shopify/POS", icon: "💻" },
  { key: "office_maintenance", label: "Office & Repairs", icon: "🔧" },
  { key: "taxes_legal", label: "Taxes & Professional", icon: "⚖️" },
  { key: "miscellaneous", label: "General & Misc", icon: "📝" },
];

export const ExpenseManager: React.FC<ExpenseManagerProps> = ({ expenses, onRefresh }) => {
  const toast = useToast();

  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("marketing_ads");
  const [amount, setAmount] = useState<number | "">("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<ExpensePaymentMethod>("bank_transfer");
  const [vendor, setVendor] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<RecurringInterval>("monthly");
  const [notes, setNotes] = useState("");

  const formatPKR = (amt: number) =>
    Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amt || 0);

  const filteredExpenses = expenses.filter((e) => {
    const matchesCat = selectedCategory === "all" || e.category === selectedCategory;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      e.title.toLowerCase().includes(term) ||
      (e.vendor && e.vendor.toLowerCase().includes(term)) ||
      (e.reference_number && e.reference_number.toLowerCase().includes(term));
    return matchesCat && matchesSearch;
  });

  const totalFilteredAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const openCreateModal = () => {
    setEditingExpense(null);
    setTitle("");
    setCategory("marketing_ads");
    setAmount("");
    setExpenseDate(new Date().toISOString().slice(0, 10));
    setPaymentMethod("bank_transfer");
    setVendor("");
    setReferenceNumber("");
    setReceiptUrl("");
    setIsRecurring(false);
    setRecurringInterval("monthly");
    setNotes("");
    setShowAddModal(true);
  };

  const openEditModal = (exp: Expense) => {
    setEditingExpense(exp);
    setTitle(exp.title);
    setCategory(exp.category);
    setAmount(exp.amount);
    setExpenseDate(exp.expense_date);
    setPaymentMethod(exp.payment_method);
    setVendor(exp.vendor || "");
    setReferenceNumber(exp.reference_number || "");
    setReceiptUrl(exp.receipt_url || "");
    setIsRecurring(exp.is_recurring);
    setRecurringInterval(exp.recurring_interval || "monthly");
    setNotes(exp.notes || "");
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || Number(amount) <= 0) {
      toast.warning("Please provide a valid title and positive amount.");
      return;
    }

    setSaving(true);
    try {
      if (editingExpense) {
        const res = await updateExpense(editingExpense.id, {
          title,
          category,
          amount: Number(amount),
          expense_date: expenseDate,
          payment_method: paymentMethod,
          vendor: vendor.trim() || null,
          reference_number: referenceNumber.trim() || null,
          receipt_url: receiptUrl.trim() || null,
          is_recurring: isRecurring,
          recurring_interval: isRecurring ? recurringInterval : null,
          notes: notes.trim() || null,
        });

        if (!res.success) throw new Error(res.error);
        toast.success("Expense updated successfully.");
      } else {
        const res = await createExpense({
          title,
          category,
          amount: Number(amount),
          expense_date: expenseDate,
          payment_method: paymentMethod,
          vendor: vendor.trim() || null,
          reference_number: referenceNumber.trim() || null,
          receipt_url: receiptUrl.trim() || null,
          is_recurring: isRecurring,
          recurring_interval: isRecurring ? recurringInterval : null,
          notes: notes.trim() || null,
        });

        if (!res.success) throw new Error(res.error);
        toast.success("Expense added to financial ledger.");
      }

      setShowAddModal(false);
      await onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to save expense.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense record?")) return;
    try {
      const res = await deleteExpense(id);
      if (!res.success) throw new Error(res.error);
      toast.success("Expense deleted.");
      await onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete expense.");
    }
  };

  return (
    <div>
      {/* Top Filter & Action Bar */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeaderBar}>
          <div>
            <h3 className={styles.cardTitle} style={{ margin: 0 }}>Operating Expense Ledger</h3>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--admin-text-sub)" }}>
              {filteredExpenses.length} Records • Total Filtered Spend:{" "}
              <strong style={{ color: "var(--color-gold)" }}>{formatPKR(totalFilteredAmount)}</strong>
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Search expenses, vendor, ref #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "6px 12px",
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "4px",
                color: "#fff",
                fontSize: "12px",
                minWidth: "220px",
              }}
            />

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ExpenseCategory | "all")}
              style={{
                padding: "6px 12px",
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "4px",
                color: "#fff",
                fontSize: "12px",
              }}
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.icon} {c.label}
                </option>
              ))}
            </select>

            <Button type="button" variant="luxury" size="sm" onClick={openCreateModal}>
              ＋ Record Expense
            </Button>
          </div>
        </div>

        {/* Expenses Data Table */}
        <div className={styles.tableResponsive}>
          {filteredExpenses.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <span style={{ fontSize: "32px" }}>🧾</span>
              <p style={{ margin: "10px 0 0", color: "var(--admin-text-sub)", fontSize: "13px" }}>
                No expenses found matching the selected criteria.
              </p>
            </div>
          ) : (
            <table className={styles.financeTable}>
              <thead>
                <tr>
                  <th>Title / Description</th>
                  <th>Category</th>
                  <th>Amount (PKR)</th>
                  <th>Date</th>
                  <th>Vendor / Payee</th>
                  <th>Method</th>
                  <th>Type</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((exp) => {
                  const catConfig = CATEGORIES.find((c) => c.key === exp.category);
                  return (
                    <tr key={exp.id}>
                      <td>
                        <strong style={{ color: "#ffffff", display: "block" }}>{exp.title}</strong>
                        {exp.reference_number && (
                          <span style={{ fontSize: "10px", color: "var(--admin-text-sub)", fontFamily: "monospace" }}>
                            Ref: {exp.reference_number}
                          </span>
                        )}
                        {exp.notes && (
                          <span style={{ fontSize: "11px", color: "var(--admin-text-sub)", display: "block" }}>
                            {exp.notes}
                          </span>
                        )}
                      </td>

                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "11px",
                            backgroundColor: "rgba(255,255,255,0.06)",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            color: "var(--admin-text)",
                          }}
                        >
                          <span>{catConfig?.icon || "📁"}</span>
                          <span>{catConfig?.label || exp.category}</span>
                        </span>
                      </td>

                      <td style={{ fontWeight: 700, color: "#f87171", fontSize: "14px" }}>
                        {formatPKR(exp.amount)}
                      </td>

                      <td style={{ fontSize: "12px", color: "var(--admin-text-sub)" }}>
                        {exp.expense_date}
                      </td>

                      <td style={{ fontSize: "12px" }}>{exp.vendor || "-"}</td>

                      <td>
                        <span style={{ fontSize: "11px", textTransform: "capitalize", color: "var(--admin-text-sub)" }}>
                          {exp.payment_method.replace("_", " ")}
                        </span>
                      </td>

                      <td>
                        {exp.is_recurring ? (
                          <span
                            style={{
                              fontSize: "10px",
                              backgroundColor: "rgba(59, 130, 246, 0.15)",
                              color: "#60a5fa",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontWeight: 600,
                              textTransform: "uppercase",
                            }}
                          >
                            Recurring ({exp.recurring_interval})
                          </span>
                        ) : (
                          <span style={{ fontSize: "11px", color: "var(--admin-text-sub)" }}>One-off</span>
                        )}
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => openEditModal(exp)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--color-gold)",
                            cursor: "pointer",
                            fontSize: "12px",
                            marginRight: "10px",
                            fontWeight: 600,
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(exp.id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CREATE / EDIT EXPENSE MODAL */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: "17px", color: "var(--color-gold)" }}>
                {editingExpense ? "Edit Expense Record" : "Record Operational Expense"}
              </h3>
              <button type="button" className={styles.closeBtn} onClick={() => setShowAddModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "var(--admin-text-sub)", marginBottom: "4px" }}>
                    Expense Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Meta Ads Week 34 / Packaging Boxes 1000pcs"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      backgroundColor: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "4px",
                      color: "#fff",
                      fontSize: "13px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "var(--admin-text-sub)", marginBottom: "4px" }}>
                    Amount (PKR) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    placeholder="e.g. 45000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                    required
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      backgroundColor: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "4px",
                      color: "#fff",
                      fontSize: "13px",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "var(--admin-text-sub)", marginBottom: "4px" }}>
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      backgroundColor: "#201f1f",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "4px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.icon} {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "var(--admin-text-sub)", marginBottom: "4px" }}>
                    Expense Date *
                  </label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      backgroundColor: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "4px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "var(--admin-text-sub)", marginBottom: "4px" }}>
                    Vendor / Payee
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Meta Ads, Package World, HBL"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      backgroundColor: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "4px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "var(--admin-text-sub)", marginBottom: "4px" }}>
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as ExpensePaymentMethod)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      backgroundColor: "#201f1f",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "4px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash (POS Till)</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="cheque">Cheque</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "var(--admin-text-sub)", marginBottom: "4px" }}>
                    Reference / Invoice #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INV-88910"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      backgroundColor: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "4px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "var(--admin-text-sub)", marginBottom: "4px" }}>
                    Receipt Image / Link (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={receiptUrl}
                    onChange={(e) => setReceiptUrl(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      backgroundColor: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "4px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                </div>
              </div>

              {/* Recurring Switch */}
              <div
                style={{
                  padding: "10px 14px",
                  backgroundColor: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "6px",
                  marginBottom: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                  />
                  <span>Mark as Recurring Operational Expense</span>
                </label>

                {isRecurring && (
                  <select
                    value={recurringInterval}
                    onChange={(e) => setRecurringInterval(e.target.value as RecurringInterval)}
                    style={{
                      padding: "4px 8px",
                      backgroundColor: "#201f1f",
                      border: "1px solid rgba(255,255,255,0.2)",
                      color: "#fff",
                      fontSize: "11px",
                      borderRadius: "4px",
                    }}
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                )}
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "11px", color: "var(--admin-text-sub)", marginBottom: "4px" }}>
                  Additional Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes regarding this transaction..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    backgroundColor: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "4px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="luxury" size="sm" isLoading={saving}>
                  {editingExpense ? "Save Changes" : "Record Expense"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
