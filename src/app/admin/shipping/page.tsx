"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/context/ToastContext";
import { ShippingCompany } from "@/types";
import { Button } from "@/components/storefront/Button/Button";
import styles from "../admin.module.css";

export default function AdminShippingPage() {
  const supabase = createClient();
  const toast = useToast();

  const [companies, setCompanies] = useState<ShippingCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingCompany, setSavingCompany] = useState(false);

  const [companyForm, setCompanyForm] = useState({
    id: "",
    name: "",
    code: "",
    phone: "",
    email: "",
    website_url: "",
    tracking_url_template: "",
    default_base_rate: "250",
    is_active: true,
  });

  const fetchCompanies = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("shipping_companies")
        .select("*")
        .order("name", { ascending: true });

      if (error || !data) {
        setCompanies([]);
      } else {
        setCompanies(data as ShippingCompany[]);
      }
    } catch (err) {
      console.error("Failed to load shipping companies:", err);
      setCompanies([]);
    }
  }, [supabase]);

  useEffect(() => {
    const load = async () => {
      await fetchCompanies();
      setLoading(false);
    };
    load();
  }, [fetchCompanies]);

  const formatPKR = (amount: number) =>
    Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const handleCompanySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!companyForm.name.trim() || !companyForm.code.trim()) {
      toast.warning("Company name and code are required.");
      return;
    }

    setSavingCompany(true);
    try {
      const payload = {
        name: companyForm.name.trim(),
        code: companyForm.code.trim().toLowerCase(),
        phone: companyForm.phone.trim() || null,
        email: companyForm.email.trim() || null,
        website_url: companyForm.website_url.trim() || null,
        tracking_url_template: companyForm.tracking_url_template.trim() || null,
        default_base_rate: Number(companyForm.default_base_rate || 0),
        is_active: companyForm.is_active,
        updated_at: new Date().toISOString(),
      };

      const query = supabase.from("shipping_companies");
      const result = companyForm.id
        ? await query.update(payload).eq("id", companyForm.id)
        : await query.insert(payload);

      if (result.error) throw new Error(result.error.message);

      toast.success(companyForm.id ? "Shipping company updated." : "Shipping company added.");
      setCompanyForm({
        id: "",
        name: "",
        code: "",
        phone: "",
        email: "",
        website_url: "",
        tracking_url_template: "",
        default_base_rate: "250",
        is_active: true,
      });
      await fetchCompanies();
    } catch (err: any) {
      toast.error(err.message || "Failed to save shipping company.");
    } finally {
      setSavingCompany(false);
    }
  };

  const startEditCompany = (company: ShippingCompany) => {
    setCompanyForm({
      id: company.id,
      name: company.name,
      code: company.code,
      phone: company.phone || "",
      email: company.email || "",
      website_url: company.website_url || "",
      tracking_url_template: company.tracking_url_template || "",
      default_base_rate: String(company.default_base_rate || 0),
      is_active: company.is_active,
    });
  };

  return (
    <div className={styles.pageLayout}>
      <div className={styles.twoColLayout}>
        <div className={styles.mainFormCol}>
          <form onSubmit={handleCompanySubmit} className={styles.formCard}>
            <h3 className={styles.formCardTitle}>Shipping Companies</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Name</label>
                <input value={companyForm.name} onChange={(e) => setCompanyForm((prev) => ({ ...prev, name: e.target.value }))} className={styles.formInput} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Code</label>
                <input value={companyForm.code} onChange={(e) => setCompanyForm((prev) => ({ ...prev, code: e.target.value }))} className={styles.formInput} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Phone</label>
                <input value={companyForm.phone} onChange={(e) => setCompanyForm((prev) => ({ ...prev, phone: e.target.value }))} className={styles.formInput} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email</label>
                <input value={companyForm.email} onChange={(e) => setCompanyForm((prev) => ({ ...prev, email: e.target.value }))} className={styles.formInput} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Website</label>
                <input value={companyForm.website_url} onChange={(e) => setCompanyForm((prev) => ({ ...prev, website_url: e.target.value }))} className={styles.formInput} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Default Base Rate</label>
                <input type="number" min={0} value={companyForm.default_base_rate} onChange={(e) => setCompanyForm((prev) => ({ ...prev, default_base_rate: e.target.value }))} className={styles.formInput} />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Tracking URL Template</label>
              <input
                value={companyForm.tracking_url_template}
                onChange={(e) => setCompanyForm((prev) => ({ ...prev, tracking_url_template: e.target.value }))}
                className={styles.formInput}
                placeholder="https://example.com/track/{tracking_number}"
              />
            </div>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={companyForm.is_active}
                onChange={(e) => setCompanyForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                className={styles.checkboxInput}
              />
              Active shipping company
            </label>
            <Button type="submit" variant="luxury" size="lg" isLoading={savingCompany}>
              {companyForm.id ? "Update Company" : "Add Company"}
            </Button>
          </form>

          <div className={styles.tableCard}>
            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.tableTh}>Company</th>
                    <th className={styles.tableTh}>Code</th>
                    <th className={styles.tableTh}>Base Rate</th>
                    <th className={styles.tableTh}>Status</th>
                    <th className={styles.tableTh}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => (
                    <tr key={company.id} className={styles.tableTr}>
                      <td className={`${styles.tableTd} ${styles.tableTdHighlight}`}>{company.name}</td>
                      <td className={styles.tableTd}>{company.code}</td>
                      <td className={styles.tableTd}>{formatPKR(Number(company.default_base_rate || 0))}</td>
                      <td className={styles.tableTd}>
                        <span className={`${styles.badge} ${company.is_active ? styles.badgeActive : styles.badgeDraft}`}>
                          {company.is_active ? "active" : "inactive"}
                        </span>
                      </td>
                      <td className={styles.tableTd}>
                        <button type="button" onClick={() => startEditCompany(company)} className={styles.tableLink} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className={styles.sidebarFormCol}>
          <div className={styles.formCard}>
            <h3 className={styles.formCardTitle}>Shipping Workflow</h3>
            <p className="font-body text-sm text-admin-text-sub" style={{ margin: 0 }}>
              Keep courier setup here and manage live shipments from the dedicated queue screen.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <Link
                href="/admin/shipping/queue"
                className={styles.signOutButton}
                style={{
                  textAlign: "center",
                  textDecoration: "none",
                  backgroundColor: "rgba(96, 165, 250, 0.1)",
                  color: "var(--color-info)",
                  borderColor: "rgba(96, 165, 250, 0.25)",
                }}
              >
                Open Shipment Queue
              </Link>
              <div style={{ border: "1px solid var(--admin-border)", padding: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <span className={styles.formLabel}>What moves faster now</span>
                <p className="font-body text-sm text-admin-text-sub" style={{ margin: 0 }}>
                  Courier master data stays isolated here, while booking, tracking, and delivery operations run from a focused shipment queue page.
                </p>
              </div>
              <div style={{ border: "1px solid var(--admin-border)", padding: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <span className={styles.formLabel}>Default rate guidance</span>
                <p className="font-body text-sm text-admin-text-sub" style={{ margin: 0 }}>
                  Set each courier&apos;s base rate here. Order-level shipment cost can still be adjusted on the order detail screen when needed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
