"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "../../../admin.module.css";
import { Button } from "@/components/storefront/Button/Button";

interface Props {
  params: Promise<{ id: string }>;
}

export default function BedsheetARConfigPage({ params }: Props) {
  const { id: productId } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [product, setProduct] = useState<any>(null);
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [status, setStatus] = useState<"not_ready" | "ready" | "disabled">("not_ready");
  const [opacity, setOpacity] = useState<number>(0.85);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0); // In degrees for user UI
  const [repeatMode, setRepeatMode] = useState<"repeat" | "cover" | "contain">("repeat");
  const [file, setFile] = useState<File | null>(null);
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch product
        const { data: productData, error: productError } = await supabase
          .from("products")
          .select("*")
          .eq("id", productId)
          .single();

        if (productError || !productData) {
          setError("Product not found");
          setLoading(false);
          return;
        }

        setProduct(productData);
        setStatus(productData.bedsheet_ar_status || "not_ready");

        // Fetch AR Asset
        const { data: assetData, error: assetError } = await supabase
          .from("bedsheet_ar_assets")
          .select("*")
          .eq("product_id", productId)
          .maybeSingle();

        if (assetData) {
          setAsset(assetData);
          setOpacity(Number(assetData.default_opacity));
          setScale(Number(assetData.default_scale));
          setRotation(Math.round(Number(assetData.default_rotation) * (180 / Math.PI))); // rad to deg
          setRepeatMode(assetData.repeat_mode || "repeat");
          setPreviewUrl(assetData.texture_url);
        }
      } catch (err: any) {
        console.error("Error loading AR data:", err);
        setError("Error loading configuration details.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [productId, supabase]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      // Create local preview
      const localUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(localUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("productId", productId);
      formData.append("defaultOpacity", opacity.toString());
      formData.append("defaultScale", scale.toString());
      
      // Convert degrees to radians for database/Three.js
      const rotationRad = (rotation * Math.PI) / 180;
      formData.append("defaultRotation", rotationRad.toString());
      formData.append("repeatMode", repeatMode);

      if (file) {
        formData.append("file", file);
      }

      // Call asset upload route
      const res = await fetch("/api/bedsheet-ar/assets", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save AR configuration");
      }

      // Explicitly update product's AR status to whatever user selected in dropdown
      const { error: productUpdateError } = await supabase
        .from("products")
        .update({ bedsheet_ar_status: status })
        .eq("id", productId);

      if (productUpdateError) {
        throw new Error(`Product status update failed: ${productUpdateError.message}`);
      }

      setSuccess("AR configuration saved successfully!");
      if (data.asset) {
        setAsset(data.asset);
        setPreviewUrl(data.asset.texture_url);
      }
      
      router.refresh();
    } catch (err: any) {
      console.error("Error saving configuration:", err);
      setError(err.message || "Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0" }}>
        <p className="font-body text-sm text-admin-text-sub">Loading AR configuration...</p>
      </div>
    );
  }

  return (
    <div className={styles.pageLayout}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/admin/products" className={styles.backLink}>
          ← Back to Products
        </Link>
      </div>

      <div style={{ borderBottom: "1px solid var(--admin-border)", paddingBottom: "16px" }}>
        <h1 className="font-headline text-3xl text-admin-text" style={{ margin: 0 }}>
          AR Bedsheet Preview Config
        </h1>
        <p className="font-body text-sm text-admin-text-sub" style={{ margin: "4px 0 0 0" }}>
          Configure live camera texture projection for:{" "}
          <strong style={{ color: "var(--color-gold)" }}>{product?.name}</strong>
        </p>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: "rgba(248, 113, 113, 0.15)",
            border: "1px solid var(--color-error)",
            color: "var(--color-error)",
            padding: "16px",
            borderRadius: "var(--radius-sm)",
            fontSize: "14px",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div
          style={{
            backgroundColor: "rgba(74, 222, 128, 0.15)",
            border: "1px solid var(--color-success)",
            color: "var(--color-success)",
            padding: "16px",
            borderRadius: "var(--radius-sm)",
            fontSize: "14px",
          }}
        >
          ✓ {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.twoColLayout}>
        {/* Left Column: Texture and status */}
        <div className={styles.mainFormCol}>
          <div className={styles.formCard}>
            <h3 className={styles.formCardTitle}>AR Status & Assets</h3>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>AR Bedsheet Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className={styles.formSelect}
              >
                <option value="not_ready">Not Ready (Hides preview button)</option>
                <option value="ready">Ready (Enables AR preview button)</option>
                <option value="disabled">Disabled (Disables and hides button)</option>
              </select>
              <span style={{ fontSize: "11px", color: "var(--admin-text-sub)" }}>
                Must be set to "Ready" and have an uploaded texture for customers to preview it.
              </span>
            </div>

            <div className={styles.formGroup} style={{ marginTop: "16px" }}>
              <label className={styles.formLabel}>Flat Bedsheet Texture</label>
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileChange}
                className={styles.formInput}
                style={{ padding: "8px" }}
              />
              <span style={{ fontSize: "11px", color: "var(--admin-text-sub)" }}>
                Upload a flat, front-facing, square texture image of the bedsheet. High-res WebP/PNG/JPG preferred. Min 800x800.
              </span>
            </div>

            {previewUrl && (
              <div style={{ marginTop: "24px" }}>
                <label className={styles.formLabel}>Bedsheet Texture Preview</label>
                <div
                  style={{
                    position: "relative",
                    width: "200px",
                    height: "200px",
                    border: "1px solid var(--admin-border)",
                    backgroundColor: "var(--admin-bg)",
                    marginTop: "8px",
                    borderRadius: "var(--radius-sm)",
                    overflow: "hidden",
                  }}
                >
                  <Image
                    src={previewUrl}
                    alt="Bedsheet Texture Preview"
                    fill
                    sizes="200px"
                    style={{ objectFit: "contain" }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Scale, opacity, rotation */}
        <div className={styles.sidebarFormCol}>
          <div className={styles.formCard}>
            <h3 className={styles.formCardTitle}>Default AR Settings</h3>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Default Opacity ({opacity})</label>
              <input
                type="range"
                min="0.10"
                max="1.00"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                style={{ accentColor: "var(--color-gold)", cursor: "pointer", width: "100%" }}
              />
              <span style={{ fontSize: "11px", color: "var(--admin-text-sub)" }}>
                Adjust transparency to let the bed's light/shadow blend with the texture overlay.
              </span>
            </div>

            <div className={styles.formGroup} style={{ marginTop: "16px" }}>
              <label className={styles.formLabel}>Default Scale (Tile size) ({scale})</label>
              <input
                type="range"
                min="0.1"
                max="3.0"
                step="0.05"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                style={{ accentColor: "var(--color-gold)", cursor: "pointer", width: "100%" }}
              />
              <span style={{ fontSize: "11px", color: "var(--admin-text-sub)" }}>
                Multiplier for repeat tiling of the pattern across the bed sheet.
              </span>
            </div>

            <div className={styles.formGroup} style={{ marginTop: "16px" }}>
              <label className={styles.formLabel}>Default Rotation ({rotation}°)</label>
              <input
                type="range"
                min="-180"
                max="180"
                step="1"
                value={rotation}
                onChange={(e) => setRotation(parseInt(e.target.value))}
                style={{ accentColor: "var(--color-gold)", cursor: "pointer", width: "100%" }}
              />
              <span style={{ fontSize: "11px", color: "var(--admin-text-sub)" }}>
                Rotate the texture orientation to match the angle of the bed.
              </span>
            </div>

            <div className={styles.formGroup} style={{ marginTop: "16px" }}>
              <label className={styles.formLabel}>Repeat Mode</label>
              <select
                value={repeatMode}
                onChange={(e) => setRepeatMode(e.target.value as any)}
                className={styles.formSelect}
              >
                <option value="repeat">Repeat (Tiled pattern)</option>
                <option value="cover">Cover (Stretch to fit)</option>
                <option value="contain">Contain (Fit within quad)</option>
              </select>
            </div>

            <div className={styles.formActionGroup} style={{ marginTop: "24px" }}>
              <Button type="submit" variant="luxury" style={{ width: "100%" }} disabled={saving}>
                {saving ? "Saving Changes..." : "Save AR Config"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
