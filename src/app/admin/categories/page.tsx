"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Category } from "@/types";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/storefront/Button/Button";
import styles from "../admin.module.css";

const DUMMY_CATEGORY_IMAGE = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=100&auto=format&fit=crop&q=80";

const MOCK_CATEGORIES: Category[] = [
  { id: "cat-rtw", name: "Ready To Wear", slug: "ready-to-wear", description: "Everyday ready prêt.", parent_id: null, sort_order: 1, is_active: true, created_at: new Date().toISOString(), image_url: DUMMY_CATEGORY_IMAGE },
  { id: "cat-formal", name: "Luxury Formal", slug: "formal", description: "Heavily embroidered formals.", parent_id: null, sort_order: 2, is_active: true, created_at: new Date().toISOString(), image_url: null },
  { id: "cat-pret", name: "Pret Collection", slug: "pret", description: "Chic luxury pret.", parent_id: null, sort_order: 3, is_active: true, created_at: new Date().toISOString(), image_url: null },
];

export default function AdminCategoriesPage() {
  const supabase = createClient();
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState("");
  const [showInHeader, setShowInHeader] = useState(false);
  const [headerLabel, setHeaderLabel] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit and Image States
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .order("sort_order", { ascending: true });

        if (error || !data || data.length === 0) {
          setCategories(MOCK_CATEGORIES);
        } else {
          setCategories(data as Category[]);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        setCategories(MOCK_CATEGORIES);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [supabase]);

  const handleEditClick = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description || "");
    setParentId(category.parent_id || "");
    setShowInHeader(Boolean(category.show_in_header));
    setHeaderLabel(category.header_label || "");
    setMetaTitle(category.meta_title || "");
    setMetaDescription(category.meta_description || "");
    setCoverImageUrl(category.image_url || null);
    setCoverImageFile(null); // Reset any selected file
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setName("");
    setDescription("");
    setParentId("");
    setShowInHeader(false);
    setHeaderLabel("");
    setMetaTitle("");
    setMetaDescription("");
    setCoverImageUrl(null);
    setCoverImageFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setSaving(true);
    const isEditing = !!editingCategory;
    const categoryId = isEditing ? editingCategory.id : `cat-${Math.random().toString(36).substring(2, 9)}`;

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    let finalImageUrl = coverImageUrl;

    try {
      // 1. Clean up old storage image if it was cleared
      if (isEditing && editingCategory.image_url && !coverImageUrl) {
        const oldUrl = editingCategory.image_url;
        if (oldUrl.includes("/storage/v1/object/public/products/")) {
          const pathToDelete = oldUrl.split("/storage/v1/object/public/products/")[1];
          await supabase.storage.from("products").remove([pathToDelete]);
        }
        finalImageUrl = null;
      }

      // 2. Upload new cover image file if selected
      if (coverImageFile) {
        const fileExt = coverImageFile.name.split(".").pop() || "jpg";
        const uniqueId = Math.random().toString(36).substring(2, 8);
        const fileName = `categories/${categoryId}/${Date.now()}-${uniqueId}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("products")
          .upload(fileName, coverImageFile, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("products")
          .getPublicUrl(fileName);

        if (publicUrlData && publicUrlData.publicUrl) {
          finalImageUrl = publicUrlData.publicUrl;
        }
      }

      const payload = {
        name,
        slug,
        description: description || null,
        parent_id: parentId || null,
        image_url: finalImageUrl,
        is_active: true,
        show_in_header: !parentId && showInHeader,
        header_label: headerLabel.trim() || null,
        meta_title: metaTitle.trim() || null,
        meta_description: metaDescription.trim() || null,
      };

      if (isEditing) {
        const { data, error } = await supabase
          .from("categories")
          .update(payload)
          .eq("id", editingCategory.id)
          .select()
          .single();

        if (error) throw error;

        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? (data as Category) : c))
        );
        handleCancelEdit();
        await fetch("/api/revalidate?tag=categories").catch(() => {});
        toast.success("Collection updated successfully!");
      } else {
        const insertPayload = {
          ...payload,
          sort_order: categories.length + 1,
        };

        const { data, error } = await supabase
          .from("categories")
          .insert(insertPayload)
          .select()
          .single();

        if (error) throw error;

        setCategories((prev) => [...prev, data as Category]);
        setName("");
        setDescription("");
        setParentId("");
        setShowInHeader(false);
        setHeaderLabel("");
        setMetaTitle("");
        setMetaDescription("");
        setCoverImageUrl(null);
        setCoverImageFile(null);
        await fetch("/api/revalidate?tag=categories").catch(() => {});
        toast.success("Collection created successfully!");
      }
    } catch (err) {
      console.error("Operation failed:", err);
      // Local simulation if DB fails
      const mockResult: Category = {
        id: categoryId,
        name,
        slug,
        description,
        parent_id: parentId || null,
        sort_order: isEditing ? editingCategory.sort_order : categories.length + 1,
        is_active: true,
        show_in_header: !parentId && showInHeader,
        header_label: headerLabel.trim() || null,
        meta_title: metaTitle.trim() || null,
        meta_description: metaDescription.trim() || null,
        created_at: new Date().toISOString(),
        image_url: finalImageUrl,
      };

      if (isEditing) {
        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? mockResult : c))
        );
        handleCancelEdit();
        toast.success("Collection updated successfully (Simulated)!");
      } else {
        setCategories((prev) => [...prev, mockResult]);
        setName("");
        setDescription("");
        setParentId("");
        setShowInHeader(false);
        setHeaderLabel("");
        setMetaTitle("");
        setMetaDescription("");
        setCoverImageUrl(null);
        setCoverImageFile(null);
        toast.success("Collection created successfully (Simulated)!");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this collection?")) return;

    try {
      const targetCategory = categories.find((c) => c.id === id);
      const { error } = await supabase.from("categories").delete().eq("id", id);
      
      if (error) {
        toast.error(`Failed to delete: ${error.message}`);
      } else {
        // Clean up image file in storage
        if (targetCategory && targetCategory.image_url && targetCategory.image_url.includes("/storage/v1/object/public/products/")) {
          const pathToDelete = targetCategory.image_url.split("/storage/v1/object/public/products/")[1];
          await supabase.storage.from("products").remove([pathToDelete]);
        }
        await fetch("/api/revalidate?tag=categories").catch(() => {});
        setCategories((prev) => prev.filter((c) => c.id !== id));
        toast.success("Collection deleted successfully!");
      }
    } catch {
      // Local simulation if DB fails
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Collection deleted successfully (Simulated)!");
    }
  };

  return (
    <div className={styles.pageLayout}>
      <div className={styles.twoColLayout}>
        {/* Left: Add/Edit Collection Form */}
        <div className={styles.sidebarFormCol}>
          <div className={styles.formCard}>
            <h3 className={styles.formCardTitle}>
              {editingCategory ? `Edit Collection: ${editingCategory.name}` : "Add Collection"}
            </h3>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Collection Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={styles.formInput}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={styles.formTextarea}
                  rows={3}
                />
              </div>

              {/* Parent Collection dropdown selector */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Parent Collection</label>
                <select
                  value={parentId}
                  onChange={(e) => {
                    setParentId(e.target.value);
                    if (e.target.value) setShowInHeader(false);
                  }}
                  className={styles.formSelect}
                >
                  <option value="" className={styles.filterOption}>None (Create as Parent Collection)</option>
                  {categories
                    .filter((c) => c.parent_id === null && (!editingCategory || c.id !== editingCategory.id))
                    .map((parent) => (
                      <option key={parent.id} value={parent.id} className={styles.filterOption}>
                        {parent.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Header Navigation</label>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--admin-text-sub)", fontSize: "13px", fontFamily: "var(--font-body)" }}>
                  <input
                    type="checkbox"
                    checked={showInHeader}
                    disabled={Boolean(parentId)}
                    onChange={(e) => setShowInHeader(e.target.checked)}
                  />
                  Show this parent collection in header
                </label>
                {parentId && (
                  <span style={{ fontSize: "11px", color: "var(--admin-text-sub)" }}>
                    Only parent collections can be shown in the header.
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Header Label</label>
                <input
                  type="text"
                  value={headerLabel}
                  onChange={(e) => setHeaderLabel(e.target.value)}
                  className={styles.formInput}
                  placeholder="Optional, e.g. Pret instead of Garments"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>SEO Title</label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className={styles.formInput}
                  placeholder="Optional custom browser/search title"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>SEO Description</label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className={styles.formTextarea}
                  rows={3}
                  placeholder="Optional custom search description"
                />
              </div>

              {/* Cover Image Upload field */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Cover Image</label>
                {coverImageUrl ? (
                  <div
                    style={{
                      position: "relative",
                      marginBottom: "8px",
                      borderRadius: "var(--radius-sm)",
                      overflow: "hidden",
                      border: "1px solid var(--admin-border)",
                      aspectRatio: "16/9",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        backgroundImage: `url(${coverImageUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCoverImageUrl(null);
                        setCoverImageFile(null);
                      }}
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        backgroundColor: "rgba(239, 68, 68, 0.9)",
                        color: "white",
                        border: "none",
                        borderRadius: "var(--radius-xs)",
                        padding: "4px 8px",
                        cursor: "pointer",
                        fontSize: "11px",
                        fontFamily: "var(--font-body)",
                        fontWeight: "bold",
                      }}
                    >
                      Remove Cover
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => document.getElementById("category-cover-input")?.click()}
                    style={{
                      border: "2px dashed var(--admin-border)",
                      borderRadius: "var(--radius-sm)",
                      padding: "24px 16px",
                      textAlign: "center",
                      cursor: "pointer",
                      backgroundColor: "var(--admin-bg)",
                      transition: "border-color 0.2s",
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.borderColor = "var(--color-gold)")}
                    onMouseOut={(e) => (e.currentTarget.style.borderColor = "var(--admin-border)")}
                  >
                    <span style={{ fontSize: "12px", color: "var(--admin-text-sub)", fontFamily: "var(--font-body)" }}>
                      Click to upload cover image
                    </span>
                    <input
                      id="category-cover-input"
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          setCoverImageFile(file);
                          setCoverImageUrl(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
                <Button type="submit" variant="luxury" fullWidth isLoading={saving}>
                  {editingCategory ? "Save Changes" : "Create Collection"}
                </Button>
                {editingCategory && (
                  <Button type="button" variant="outline" fullWidth onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right: Collections list table with Thumbnails */}
        <div className={styles.mainFormCol}>
          {loading ? (
            <p className="font-body text-sm text-admin-text-sub text-center py-12">Loading collections...</p>
          ) : (
            <div className={styles.tableCard}>
              <div className={styles.tableResponsive}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.tableTh} style={{ width: "60px" }}>Cover</th>
                      <th className={styles.tableTh}>Name</th>
                      <th className={styles.tableTh}>Slug</th>
                      <th className={styles.tableTh}>Header</th>
                      <th className={styles.tableTh}>Description</th>
                      <th className={styles.tableTh}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((c) => {
                      const displayImage = c.image_url || DUMMY_CATEGORY_IMAGE;
                      const parentCategory = c.parent_id ? categories.find((p) => p.id === c.parent_id) : null;
                      return (
                        <tr key={c.id} className={styles.tableTr}>
                          <td className={styles.tableTd}>
                            <div
                              style={{
                                width: "40px",
                                height: "40px",
                                backgroundImage: `url(${displayImage})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                borderRadius: "var(--radius-sm)",
                                border: "1px solid var(--admin-border)",
                              }}
                            />
                          </td>
                          <td className={`${styles.tableTd} ${styles.tableTdHighlight}`}>
                            {parentCategory && (
                              <div style={{ fontSize: "10px", color: "var(--color-gold)", textTransform: "uppercase", fontWeight: "bold", marginBottom: "4px" }}>
                                {parentCategory.name} ›
                              </div>
                            )}
                            {c.name}
                          </td>
                          <td className={styles.tableTd}>
                            <span className={styles.dateBadge} style={{ padding: "4px 8px" }}>{c.slug}</span>
                          </td>
                          <td className={styles.tableTd}>
                            {c.show_in_header ? (
                              <span className={styles.badgeActive}>
                                {c.header_label || c.name}
                              </span>
                            ) : (
                              <span className={styles.badgeDraft}>Hidden</span>
                            )}
                          </td>
                          <td className={styles.tableTd} style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {c.description || "—"}
                          </td>
                          <td className={styles.tableTd}>
                            <div style={{ display: "flex", gap: "12px" }}>
                              <button
                                onClick={() => handleEditClick(c)}
                                className="font-body text-sm font-bold bg-transparent border-0 cursor-pointer transition-colors duration-200"
                                style={{ padding: 0, color: "var(--color-gold)" }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(c.id)}
                                className="font-body text-sm font-bold bg-transparent border-0 cursor-pointer text-error transition-colors duration-200 hover:text-red-700"
                                style={{ padding: 0 }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
