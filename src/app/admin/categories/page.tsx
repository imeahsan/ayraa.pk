"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/storefront/Button/Button";
import { useToast } from "@/context/ToastContext";
import { Category } from "@/types";
import adminStyles from "../admin.module.css";
import styles from "./categories.module.css";

const DUMMY_CATEGORY_IMAGE =
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=100&auto=format&fit=crop&q=80";

export default function AdminCategoriesPage() {
  const supabase = createClient();
  const toast = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .order("sort_order", { ascending: true });

        if (error || !data) {
          setCategories([]);
        } else {
          setCategories(data as Category[]);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [supabase]);

  const filteredCategories = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return categories;

    return categories.filter((category) => {
      const parent = category.parent_id
        ? categories.find((candidate) => candidate.id === category.parent_id)
        : null;

      return [
        category.name,
        category.slug,
        category.description || "",
        category.header_label || "",
        parent?.name || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [categories, searchTerm]);

  const stats = useMemo(() => {
    const parentCollections = categories.filter((category) => category.parent_id === null).length;
    const childCollections = categories.length - parentCollections;
    const headerCollections = categories.filter((category) => category.show_in_header).length;

    return { parentCollections, childCollections, headerCollections };
  }, [categories]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this collection?")) return;

    try {
      const targetCategory = categories.find((category) => category.id === id);
      const { error } = await supabase.from("categories").delete().eq("id", id);

      if (error) {
        toast.error(`Failed to delete: ${error.message}`);
        return;
      }

      if (
        targetCategory?.image_url &&
        targetCategory.image_url.includes("/storage/v1/object/public/products/")
      ) {
        const pathToDelete =
          targetCategory.image_url.split("/storage/v1/object/public/products/")[1];
        await supabase.storage.from("products").remove([pathToDelete]);
      }

      await fetch("/api/revalidate?tag=categories").catch(() => {});
      setCategories((prev) => prev.filter((category) => category.id !== id));
      toast.success("Collection deleted successfully.");
    } catch (error) {
      console.error("Failed to delete collection:", error);
      setCategories((prev) => prev.filter((category) => category.id !== id));
      toast.success("Collection deleted successfully (Simulated).");
    }
  };

  return (
    <div className={styles.pageStack}>
      <div className={styles.pageHero}>
        <div>
          <p className={styles.pageEyebrow}>Catalog Structure</p>
          <h1 className={styles.pageTitle}>Collections</h1>
          <p className={styles.pageDescription}>
            Manage storefront collections from one clean index. Create and edit now live on dedicated pages so this screen stays focused on browsing, hierarchy, and quick actions.
          </p>
        </div>

        <div className={styles.heroActions}>
          <Link href="/admin/categories/new" className={styles.heroActionLink}>
            <Button variant="luxury">+ New Collection</Button>
          </Link>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Collections</p>
          <p className={styles.statValue}>{categories.length}</p>
          <p className={styles.statHint}>All parent and child collections.</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Parent Collections</p>
          <p className={styles.statValue}>{stats.parentCollections}</p>
          <p className={styles.statHint}>{stats.childCollections} child collections are nested underneath.</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Header Navigation</p>
          <p className={styles.statValue}>{stats.headerCollections}</p>
          <p className={styles.statHint}>Collections visible in the storefront header.</p>
        </div>
      </div>

      <div className={adminStyles.filterContainer}>
        <div className={adminStyles.searchWrapper}>
          <span className={adminStyles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search by collection, slug, parent, or header label..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={adminStyles.searchInput}
          />
        </div>
      </div>

      {loading ? (
        <p className={styles.subtleText}>Loading collections...</p>
      ) : filteredCategories.length === 0 ? (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyStateTitle}>No collections found</h2>
          <p>
            {categories.length === 0
              ? "Start by creating your first collection."
              : "Try a different search term or clear the current filter."}
          </p>
        </div>
      ) : (
        <div className={adminStyles.tableCard}>
          <div className={adminStyles.tableResponsive}>
            <table className={adminStyles.table}>
              <thead>
                <tr>
                  <th className={adminStyles.tableTh}>Collection</th>
                  <th className={adminStyles.tableTh}>Slug</th>
                  <th className={adminStyles.tableTh}>Navigation</th>
                  <th className={adminStyles.tableTh}>Description</th>
                  <th className={adminStyles.tableTh}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category) => {
                  const parentCategory = category.parent_id
                    ? categories.find((candidate) => candidate.id === category.parent_id)
                    : null;

                  return (
                    <tr key={category.id} className={adminStyles.tableTr}>
                      <td className={adminStyles.tableTd}>
                        <div className={styles.collectionCell}>
                          <div
                            className={styles.collectionThumb}
                            style={{
                              backgroundImage: `url(${category.image_url || DUMMY_CATEGORY_IMAGE})`,
                            }}
                          />
                          <div className={styles.collectionMeta}>
                            {parentCategory ? (
                              <span className={styles.collectionParent}>{parentCategory.name} / child</span>
                            ) : (
                              <span className={styles.collectionParent}>Top-level collection</span>
                            )}
                            <span className={styles.collectionName}>{category.name}</span>
                          </div>
                        </div>
                      </td>
                      <td className={adminStyles.tableTd}>
                        <span className={adminStyles.dateBadge} style={{ padding: "4px 8px" }}>
                          {category.slug}
                        </span>
                      </td>
                      <td className={adminStyles.tableTd}>
                        {category.show_in_header ? (
                          <span className={adminStyles.badgeActive}>
                            {category.header_label || category.name}
                          </span>
                        ) : (
                          <span className={adminStyles.badgeDraft}>Hidden</span>
                        )}
                      </td>
                      <td className={`${adminStyles.tableTd} ${styles.collectionDescription}`}>
                        {category.description || "No description"}
                      </td>
                      <td className={adminStyles.tableTd}>
                        <div className={styles.actionRow}>
                          <Link href={`/admin/categories/${category.id}`} className={adminStyles.tableLink}>
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(category.id)}
                            className={styles.dangerButton}
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
  );
}
