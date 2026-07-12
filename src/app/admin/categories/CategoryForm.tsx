"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/storefront/Button/Button";
import { useToast } from "@/context/ToastContext";
import { Category } from "@/types";
import adminStyles from "../admin.module.css";
import styles from "./categories.module.css";

interface CategoryFormProps {
  categoryId?: string;
}

interface CategoryFormState {
  name: string;
  description: string;
  parentId: string;
  showInHeader: boolean;
  isComingSoon: boolean;
  headerLabel: string;
  metaTitle: string;
  metaDescription: string;
}

const DUMMY_CATEGORY_IMAGE =
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=100&auto=format&fit=crop&q=80";

const INITIAL_FORM_STATE: CategoryFormState = {
  name: "",
  description: "",
  parentId: "",
  showInHeader: false,
  isComingSoon: false,
  headerLabel: "",
  metaTitle: "",
  metaDescription: "",
};

export function CategoryForm({ categoryId }: CategoryFormProps) {
  const supabase = createClient();
  const toast = useToast();
  const router = useRouter();
  const isEditing = Boolean(categoryId);

  const [categories, setCategories] = useState<Category[]>([]);
  const [formState, setFormState] = useState<CategoryFormState>(INITIAL_FORM_STATE);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const categoriesPromise = supabase
          .from("categories")
          .select("*")
          .order("sort_order", { ascending: true });

        const categoryPromise = categoryId
          ? supabase.from("categories").select("*").eq("id", categoryId).single()
          : Promise.resolve({ data: null, error: null });

        const [{ data: categoriesData, error: categoriesError }, { data: categoryData, error: categoryError }] =
          await Promise.all([categoriesPromise, categoryPromise]);

        if (!categoriesError && categoriesData) {
          setCategories(categoriesData as Category[]);
        } else {
          setCategories([]);
        }

        if (categoryId) {
          if (categoryError || !categoryData) {
            toast.error("Could not load this collection.");
            setEditingCategory(null);
          } else {
            const category = categoryData as Category;
            setEditingCategory(category);
            setFormState({
              name: category.name,
              description: category.description || "",
              parentId: category.parent_id || "",
              showInHeader: Boolean(category.show_in_header),
              isComingSoon: Boolean(category.is_coming_soon),
              headerLabel: category.header_label || "",
              metaTitle: category.meta_title || "",
              metaDescription: category.meta_description || "",
            });
            setCoverImageUrl(category.image_url || null);
          }
        }
      } catch (error) {
        console.error("Failed to load collection form data:", error);
        toast.error("Could not load collection data.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [categoryId, supabase, toast]);

  const availableParentCategories = useMemo(
    () =>
      categories.filter(
        (category) => category.parent_id === null && (!categoryId || category.id !== categoryId)
      ),
    [categories, categoryId]
  );

  const selectedParent = useMemo(
    () => categories.find((category) => category.id === formState.parentId) || null,
    [categories, formState.parentId]
  );

  const updateField = <K extends keyof CategoryFormState>(field: K, value: CategoryFormState[K]) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleImagePick = (file: File) => {
    setCoverImageFile(file);
    setCoverImageUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formState.name.trim()) return;

    setSaving(true);
    const categoryRecordId =
      editingCategory?.id || `cat-${Math.random().toString(36).substring(2, 9)}`;
    const slug = formState.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    let finalImageUrl = coverImageUrl;

    try {
      if (editingCategory?.image_url && !coverImageUrl) {
        const oldUrl = editingCategory.image_url;
        if (oldUrl.includes("/storage/v1/object/public/products/")) {
          const pathToDelete = oldUrl.split("/storage/v1/object/public/products/")[1];
          await supabase.storage.from("products").remove([pathToDelete]);
        }
        finalImageUrl = null;
      }

      if (coverImageFile) {
        const fileExt = coverImageFile.name.split(".").pop() || "jpg";
        const uniqueId = Math.random().toString(36).substring(2, 8);
        const fileName = `categories/${categoryRecordId}/${Date.now()}-${uniqueId}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("products")
          .upload(fileName, coverImageFile, { cacheControl: "31536000", upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from("products").getPublicUrl(fileName);
        if (publicUrlData?.publicUrl) {
          finalImageUrl = publicUrlData.publicUrl;
        }
      }

      const payload = {
        name: formState.name.trim(),
        slug,
        description: formState.description.trim() || null,
        parent_id: formState.parentId || null,
        image_url: finalImageUrl,
        is_active: true,
        show_in_header: !formState.parentId && formState.showInHeader,
        is_coming_soon: formState.isComingSoon,
        header_label: formState.headerLabel.trim() || null,
        meta_title: formState.metaTitle.trim() || null,
        meta_description: formState.metaDescription.trim() || null,
      };

      if (editingCategory) {
        const { error } = await supabase.from("categories").update(payload).eq("id", editingCategory.id);
        if (error) throw error;
        await fetch("/api/revalidate?tag=categories").catch(() => {});
        toast.success("Collection updated successfully.");
      } else {
        const sortOrder =
          categories.length > 0 ? Math.max(...categories.map((category) => category.sort_order)) + 1 : 1;
        const { error } = await supabase.from("categories").insert({ ...payload, sort_order: sortOrder });
        if (error) throw error;
        await fetch("/api/revalidate?tag=categories").catch(() => {});
        toast.success("Collection created successfully.");
      }

      router.push("/admin/categories");
      router.refresh();
    } catch (error) {
      console.error("Failed to save collection:", error);
      toast.error(`Could not save collection${error instanceof Error ? `: ${error.message}` : "."}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className={styles.subtleText}>Loading collection form...</p>;
  }

  if (isEditing && !editingCategory) {
    return (
      <div className={styles.statusCard}>
        <p className={styles.subtleText}>This collection could not be found.</p>
        <Link href="/admin/categories" className={styles.backLink}>
          Back to collections
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.formShell}>
      <Link href="/admin/categories" className={styles.backLink}>
        ← Back to collections
      </Link>

      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <h1 className={styles.formTitle}>
            {editingCategory ? `Edit ${editingCategory.name}` : "Create collection"}
          </h1>
          <p className={styles.formDescription}>
            Keep collections focused. Parent collections shape navigation, while child collections keep the storefront tidy.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.formGrid}>
          <div className={styles.formMain}>
            <div className={adminStyles.formGroup}>
              <label className={adminStyles.formLabel}>Collection Name *</label>
              <input
                type="text"
                value={formState.name}
                onChange={(e) => updateField("name", e.target.value)}
                className={adminStyles.formInput}
                required
              />
            </div>

            <div className={adminStyles.formGroup}>
              <label className={adminStyles.formLabel}>Description</label>
              <textarea
                value={formState.description}
                onChange={(e) => updateField("description", e.target.value)}
                className={adminStyles.formTextarea}
                rows={4}
              />
            </div>

            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Structure</h2>
              <div className={adminStyles.formGroup}>
                <label className={adminStyles.formLabel}>Parent Collection</label>
                <select
                  value={formState.parentId}
                  onChange={(e) => {
                    updateField("parentId", e.target.value);
                    if (e.target.value) updateField("showInHeader", false);
                  }}
                  className={adminStyles.formSelect}
                >
                  <option value="" className={adminStyles.filterOption}>
                    None (top-level collection)
                  </option>
                  {availableParentCategories.map((category) => (
                    <option key={category.id} value={category.id} className={adminStyles.filterOption}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <p className={styles.helperText}>
                {selectedParent
                  ? `This collection will sit under ${selectedParent.name}.`
                  : "Leave this empty to create a top-level collection."}
              </p>
            </div>

            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>SEO</h2>
              <div className={adminStyles.formGroup}>
                <label className={adminStyles.formLabel}>SEO Title</label>
                <input
                  type="text"
                  value={formState.metaTitle}
                  onChange={(e) => updateField("metaTitle", e.target.value)}
                  className={adminStyles.formInput}
                  placeholder="Optional custom browser/search title"
                />
              </div>
              <div className={adminStyles.formGroup}>
                <label className={adminStyles.formLabel}>SEO Description</label>
                <textarea
                  value={formState.metaDescription}
                  onChange={(e) => updateField("metaDescription", e.target.value)}
                  className={adminStyles.formTextarea}
                  rows={4}
                  placeholder="Optional custom search description"
                />
              </div>
            </div>
          </div>

          <div className={styles.formSidebar}>
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Visibility</h2>
              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={formState.showInHeader}
                  disabled={Boolean(formState.parentId)}
                  onChange={(e) => updateField("showInHeader", e.target.checked)}
                />
                Show in header navigation
              </label>
              <p className={styles.helperText}>
                {formState.parentId
                  ? "Header visibility is only available for top-level collections."
                  : "Use this for parent collections that should appear in the storefront header."}
              </p>

              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={formState.isComingSoon}
                  onChange={(e) => updateField("isComingSoon", e.target.checked)}
                />
                Mark this collection as coming soon
              </label>
              <p className={styles.helperText}>
                When enabled, the storefront will show a launch-soon landing page for this collection instead of its products.
              </p>

              <div className={adminStyles.formGroup}>
                <label className={adminStyles.formLabel}>Header Label</label>
                <input
                  type="text"
                  value={formState.headerLabel}
                  onChange={(e) => updateField("headerLabel", e.target.value)}
                  className={adminStyles.formInput}
                  placeholder="Optional shorter navigation label"
                />
              </div>
            </div>

            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Cover Image</h2>
              {coverImageUrl ? (
                <div className={styles.previewImage}>
                  <div
                    className={styles.previewImageFill}
                    style={{ backgroundImage: `url(${coverImageUrl || DUMMY_CATEGORY_IMAGE})` }}
                  />
                  <button
                    type="button"
                    className={styles.removeImageButton}
                    onClick={() => {
                      setCoverImageUrl(null);
                      setCoverImageFile(null);
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className={styles.uploadDropzone}>
                  <span className={styles.helperText}>Click to upload a collection cover image.</span>
                  <input
                    type="file"
                    accept="image/*"
                    className={styles.hiddenInput}
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleImagePick(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              )}
            </div>

            <div className={styles.formActions}>
              <Button type="submit" variant="luxury" isLoading={saving}>
                {editingCategory ? "Save Collection" : "Create Collection"}
              </Button>
              <Link href="/admin/categories" className={styles.formActionLink}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
