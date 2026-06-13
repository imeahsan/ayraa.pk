"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { StoreSettings } from "@/types";
import { Button } from "@/components/storefront/Button/Button";
import styles from "../admin.module.css";

const DEFAULT_SETTINGS: StoreSettings = {
  brand_name: "Ayraa Collection",
  brand_description: "Premium Eastern Haute Couture.",
  contact_email: "care@ayraacollection.com",
  contact_phone: "+92 21 111-999-888",
  shipping_flat_rate: 250,
  free_shipping_threshold: 5000,
  meta_title_template: "Ayraa | %s",
  meta_description: "Luxury prêt-à-porter collection for women.",
  logo_url: null,
  favicon_url: null,
};

export default function AdminSettingsPage() {
  const supabase = createClient();
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
  }, [supabase]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: name.includes("rate") || name.includes("threshold") ? Number(value) : value,
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
        alert("Settings saved successfully (Locally)");
      } else {
        alert("Settings updated successfully in Database.");
      }
    } catch (err) {
      localStorage.setItem("ayra_store_settings", JSON.stringify(settings));
      alert("Settings saved successfully (Locally)");
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
