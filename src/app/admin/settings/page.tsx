"use client";

import React, { useState, useEffect } from "react";
import { getEmailRuntimeDiagnosticsAction } from "@/app/actions/email";
import { createClient } from "@/lib/supabase/client";
import { StoreSettings } from "@/types";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/storefront/Button/Button";
import styles from "../admin.module.css";

const DEFAULT_SETTINGS: StoreSettings = {
  brand_name: "Ayraa Collection",
  brand_description: "Premium Eastern Haute Couture.",
  contact_email: "care@ayraa.pk",
  contact_phone: "+92 21 111-999-888",
  shipping_flat_rate: 250,
  free_shipping_threshold: 5000,
  meta_title_template: "Ayraa | %s",
  meta_description: "Luxury prêt-à-porter collection for women.",
  logo_url: null,
  favicon_url: null,
  smtp_host: "smtp-relay.brevo.com",
  smtp_port: 587,
  smtp_user: "",
  smtp_pass: "",
  email_from_address: "",
  email_from_name: "Ayraa Collection",
};

type EmailDiagnostics = {
  provider: "brevo_api" | "smtp";
  canSend: boolean;
  smtpHost: string | null;
  smtpPort: number;
  hasSmtpUser: boolean;
  hasSmtpPass: boolean;
  hasBrevoApiKey: boolean;
  fromAddress: string | null;
  fromName: string | null;
  fromSource: string | null;
  supportEmail: string | null;
  brandName: string | null;
  issues: string[];
};

export default function AdminSettingsPage() {
  const supabase = createClient();
  const toast = useToast();
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emailDiagnostics, setEmailDiagnostics] = useState<EmailDiagnostics | null>(null);

  const loadEmailDiagnostics = async () => {
    try {
      const result = await getEmailRuntimeDiagnosticsAction();
      if ("error" in result) {
        console.error("Failed to load email diagnostics:", result.error);
        return;
      }
      setEmailDiagnostics(result);
    } catch (err) {
      console.error("Failed to load email diagnostics:", err);
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("store_settings")
          .select("*")
          .single();

        if (error || !data) {
          // Fallback to local storage if DB is not setup or empty
          const stored = localStorage.getItem("ayra_store_settings");
          if (stored) {
            setSettings(JSON.parse(stored));
          } else {
            setSettings(DEFAULT_SETTINGS);
          }
        } else {
          setSettings(data as StoreSettings);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
    void loadEmailDiagnostics();
  }, [supabase]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: name.includes("rate") || name.includes("threshold") || name.includes("port") ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Upsert into DB
      const { error } = await supabase
        .from("store_settings")
        .upsert({ id: 1, ...settings });

      if (error) {
        // Fallback local storage
        localStorage.setItem("ayra_store_settings", JSON.stringify(settings));
        toast.success("Settings saved successfully (Locally)");
      } else {
        toast.success("Settings updated successfully in Database.");
      }
      await loadEmailDiagnostics();
    } catch {
      localStorage.setItem("ayra_store_settings", JSON.stringify(settings));
      toast.success("Settings saved successfully (Locally)");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="font-body text-sm text-admin-text-sub text-center py-12">Loading store settings...</p>;

  return (
    <div className={styles.pageLayout}>
      <form onSubmit={handleSubmit} className={styles.twoColLayout}>
        <div className={styles.mainFormCol}>
          {/* Brand Identity */}
          <div className={styles.formCard}>
            <h3 className={styles.formCardTitle}>Brand Identity</h3>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Brand Name</label>
              <input
                type="text"
                name="brand_name"
                value={settings.brand_name}
                onChange={handleInputChange}
                className={styles.formInput}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Brand Description</label>
              <textarea
                name="brand_description"
                value={settings.brand_description}
                onChange={handleInputChange}
                className={styles.formTextarea}
                rows={3}
              />
            </div>
          </div>

          {/* Pricing Rules */}
          <div className={styles.formCard}>
            <h3 className={styles.formCardTitle}>Shipping &amp; Taxes</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Flat Shipping Cost (PKR)</label>
                <input
                  type="number"
                  name="shipping_flat_rate"
                  value={settings.shipping_flat_rate}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Free Shipping Threshold (PKR)</label>
                <input
                  type="number"
                  name="free_shipping_threshold"
                  value={settings.free_shipping_threshold}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  required
                />
              </div>
            </div>
          </div>

          {/* SMTP Server Settings */}
          <div className={styles.formCard}>
            <h3 className={styles.formCardTitle}>SMTP Server Settings</h3>
            <p style={{ fontSize: "12px", color: "var(--color-admin-text-sub)", marginBottom: "16px", opacity: 0.7 }}>
              Configure the mail server credentials used to send order confirmations and email alerts.
            </p>
            
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>SMTP Host</label>
                <input
                  type="text"
                  name="smtp_host"
                  value={settings.smtp_host || ""}
                  onChange={handleInputChange}
                  placeholder="e.g. smtp-relay.brevo.com"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>SMTP Port</label>
                <input
                  type="number"
                  name="smtp_port"
                  value={settings.smtp_port || ""}
                  onChange={handleInputChange}
                  placeholder="e.g. 587"
                  className={styles.formInput}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>SMTP Username (Login)</label>
                <input
                  type="text"
                  name="smtp_user"
                  value={settings.smtp_user || ""}
                  onChange={handleInputChange}
                  placeholder="e.g. user@smtp-provider.com"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>SMTP Password (Key)</label>
                <input
                  type="password"
                  name="smtp_pass"
                  value={settings.smtp_pass || ""}
                  onChange={handleInputChange}
                  placeholder="••••••••••••••••"
                  className={styles.formInput}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Sender Email Address</label>
                <input
                  type="email"
                  name="email_from_address"
                  value={settings.email_from_address || ""}
                  onChange={handleInputChange}
                  placeholder="e.g. info@ayraa.pk"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Sender Name</label>
                <input
                  type="text"
                  name="email_from_name"
                  value={settings.email_from_name || ""}
                  onChange={handleInputChange}
                  placeholder="e.g. Ayraa Collection"
                  className={styles.formInput}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Support Info */}
        <div className={styles.sidebarFormCol}>
          <div className={styles.formCard}>
            <h3 className={styles.formCardTitle}>Customer Support</h3>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Support Phone Helpline</label>
              <input
                type="text"
                name="contact_phone"
                value={settings.contact_phone}
                onChange={handleInputChange}
                className={styles.formInput}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Support Email Address</label>
              <input
                type="email"
                name="contact_email"
                value={settings.contact_email}
                onChange={handleInputChange}
                className={styles.formInput}
                required
              />
            </div>
          </div>

          <div className={styles.formCard}>
            <h3 className={styles.formCardTitle}>Email Runtime</h3>
            <div className={styles.card} style={{ padding: "16px", marginBottom: "16px" }}>
              <span className={styles.cardLabel}>Provider</span>
              <strong className={styles.cardValue}>{emailDiagnostics?.provider === "brevo_api" ? "Brevo API" : "SMTP"}</strong>
              <span className={styles.reportSummaryText}>
                Sender: {emailDiagnostics?.fromAddress || "Not resolved"} ({emailDiagnostics?.fromSource || "unknown source"})
              </span>
            </div>

            <div style={{ display: "grid", gap: "10px", fontSize: "12px", color: "var(--admin-text-sub)" }}>
              <div>Sender name: {emailDiagnostics?.fromName || "Not set"}</div>
              <div>Support email: {emailDiagnostics?.supportEmail || "Not set"}</div>
              <div>SMTP host: {emailDiagnostics?.smtpHost || "Not set"}:{emailDiagnostics?.smtpPort || 587}</div>
              <div>SMTP login present: {emailDiagnostics?.hasSmtpUser ? "Yes" : "No"}</div>
              <div>SMTP/API secret present: {emailDiagnostics?.hasSmtpPass ? "Yes" : "No"}</div>
              <div>Brevo API key present: {emailDiagnostics?.hasBrevoApiKey ? "Yes" : "No"}</div>
              <div>Status: {emailDiagnostics?.canSend ? "Ready to send" : "Blocked"}</div>
            </div>

            {emailDiagnostics && emailDiagnostics.issues.length > 0 ? (
              <div style={{ marginTop: "16px", padding: "14px", border: "1px solid var(--admin-border)", background: "rgba(255,255,255,0.03)" }}>
                <strong style={{ display: "block", fontSize: "12px", color: "var(--admin-text)", marginBottom: "8px" }}>Detected issues</strong>
                {emailDiagnostics.issues.map((issue) => (
                  <div key={issue} className={styles.reportSummaryText} style={{ marginTop: "6px" }}>
                    {issue}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className={styles.formActionGroup}>
            <Button type="submit" variant="luxury" size="lg" fullWidth isLoading={saving}>
              Save Settings
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
