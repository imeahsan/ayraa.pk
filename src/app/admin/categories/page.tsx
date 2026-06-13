"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Category } from "@/types";
import { Button } from "@/components/storefront/Button/Button";
import styles from "../admin.module.css";

const MOCK_CATEGORIES: Category[] = [
  { id: "cat-rtw", name: "Ready To Wear", slug: "ready-to-wear", description: "Everyday ready prêt.", parent_id: null, sort_order: 1, is_active: true, created_at: new Date().toISOString(), image_url: null },
  { id: "cat-formal", name: "Luxury Formal", slug: "formal", description: "Heavily embroidered formals.", parent_id: null, sort_order: 2, is_active: true, created_at: new Date().toISOString(), image_url: null },
  { id: "cat-pret", name: "Pret Collection", slug: "pret", description: "Chic luxury pret.", parent_id: null, sort_order: 3, is_active: true, created_at: new Date().toISOString(), image_url: null },
];

export default function AdminCategoriesPage() {
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setSaving(true);
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const payload = {
      name,
      slug,
      description: description || null,
      sort_order: categories.length + 1,
      is_active: true,
    };

    try {
      const { data, error } = await supabase
        .from("categories")
        .insert(payload)
        .select()
        .single();

      if (error) {
        alert(`Failed to add: ${error.message}`);
      } else if (data) {
        setCategories((prev) => [...prev, data as Category]);
        setName("");
        setDescription("");
      }
    } catch (err) {
      // Local simulation if DB fails
      const mockNew: Category = {
        id: `cat-${Math.random().toString(36).substr(2, 9)}`,
        name,
        slug,
        description,
        parent_id: null,
        sort_order: categories.length + 1,
        is_active: true,
        created_at: new Date().toISOString(),
        image_url: null,
      };
      setCategories((prev) => [...prev, mockNew]);
      setName("");
      setDescription("");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) {
        alert(`Failed to delete: ${error.message}`);
      } else {
        setCategories((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      // Local simulation if DB fails
      setCategories((prev) => prev.filter((c) => c.id !== id));
    }
  };

  return (
    <div className={styles.pageLayout}>
      <div className={styles.twoColLayout}>
        {/* Left: Add Category Form */}
        <div className={styles.sidebarFormCol}>
          <div className={styles.formCard}>
            <h3 className={styles.formCardTitle}>Add Category</h3>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Category Name *</label>
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

              <Button type="submit" variant="luxury" fullWidth isLoading={saving}>
                Create Category
              </Button>
            </form>
          </div>
        </div>

        {/* Right: Categories list table */}
        <div className={styles.mainFormCol}>
          {loading ? (
            <p className="font-body text-sm text-admin-text-sub text-center py-12">Loading categories...</p>
          ) : (
            <div className={styles.tableCard}>
              <div className={styles.tableResponsive}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.tableTh}>Name</th>
                      <th className={styles.tableTh}>Slug</th>
                      <th className={styles.tableTh}>Description</th>
                      <th className={styles.tableTh}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((c) => (
                      <tr key={c.id} className={styles.tableTr}>
                        <td className={`${styles.tableTd} ${styles.tableTdHighlight}`}>{c.name}</td>
                        <td className={styles.tableTd}>
                          <span className={styles.dateBadge} style={{ padding: "4px 8px" }}>{c.slug}</span>
                        </td>
                        <td className={styles.tableTd} style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {c.description || "—"}
                        </td>
                        <td className={styles.tableTd}>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="font-body text-sm font-bold bg-transparent border-0 cursor-pointer text-error transition-colors duration-200 hover:text-red-700"
                            style={{ padding: 0 }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
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
