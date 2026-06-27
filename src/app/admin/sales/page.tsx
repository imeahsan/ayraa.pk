"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Product, Category } from "@/types";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/storefront/Button/Button";
import styles from "../admin.module.css";

export default function AdminSalesPage() {
  const supabase = createClient();
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [originalProducts, setOriginalProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [saleFilter, setSaleFilter] = useState<"all" | "sale" | "regular">("all");

  // Bulk Actions
  const [bulkDiscountPercent, setBulkDiscountPercent] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: catData } = await supabase
          .from("categories")
          .select("*")
          .order("name", { ascending: true });

        if (catData) setCategories(catData as Category[]);

        const { data: prodData, error } = await supabase
          .from("products")
          .select("*, category:categories(*), images:product_images(*)")
          .order("name", { ascending: true });

        if (error || !prodData) {
          setProducts([]);
          setOriginalProducts([]);
        } else {
          const cleanData = (prodData as Product[]).map(p => ({
            ...p,
            is_on_sale: p.is_on_sale || false
          }));
          setProducts(cleanData);
          setOriginalProducts(JSON.parse(JSON.stringify(cleanData)));
        }
      } catch (err) {
        console.error("Failed to load products:", err);
        setProducts([]);
        setOriginalProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  // Handle inline property updates
  const handleProductChange = (id: string, field: keyof Product, value: any) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        
        const updated = { ...p, [field]: value };

        // If toggling on sale, and compare_at_price is empty/null, pre-populate compare_at_price with current price
        if (field === "is_on_sale" && value === true && !p.compare_at_price) {
          updated.compare_at_price = p.price;
        }

        return updated;
      })
    );
  };

  // Bulk apply discount to all currently checked (is_on_sale) items
  const handleBulkDiscount = () => {
    const percent = parseFloat(bulkDiscountPercent);
    if (isNaN(percent) || percent <= 0 || percent > 100) {
      toast.warning("Please enter a valid discount percentage between 1 and 100.");
      return;
    }

    setProducts((prev) =>
      prev.map((p) => {
        // Only apply bulk actions to products that match the filters AND are checked (on sale)
        const isMatched = filteredProducts.some((fp) => fp.id === p.id);
        if (!isMatched || !p.is_on_sale) return p;

        // Base the discount calculations on compare_at_price if set, otherwise current price
        const originalPrice = p.compare_at_price || p.price;
        const newPrice = Math.round(originalPrice * (1 - percent / 100));

        return {
          ...p,
          compare_at_price: originalPrice,
          price: newPrice,
        };
      })
    );
    setBulkDiscountPercent("");
  };

  // Bulk remove selected products from sale
  const handleBulkRemoveSale = () => {
    setProducts((prev) =>
      prev.map((p) => {
        const isMatched = filteredProducts.some((fp) => fp.id === p.id);
        if (!isMatched || !p.is_on_sale) return p;

        // Restore original price if compare_at_price exists
        return {
          ...p,
          is_on_sale: false,
          price: p.compare_at_price || p.price,
          compare_at_price: null,
        };
      })
    );
  };

  // Find products that have been modified compared to original state
  const modifiedProducts = useMemo(() => {
    return products.filter((p) => {
      const orig = originalProducts.find((o) => o.id === p.id);
      if (!orig) return false;
      return (
        p.is_on_sale !== orig.is_on_sale ||
        p.price !== orig.price ||
        p.compare_at_price !== orig.compare_at_price ||
        p.is_active !== orig.is_active
      );
    });
  }, [products, originalProducts]);

  const hasUnsavedChanges = modifiedProducts.length > 0;

  // Save changes to Database
  const handleSaveChanges = async () => {
    if (modifiedProducts.length === 0) return;
    setSaving(true);

    try {
      // Perform updates one by one or in parallel
      const updatePromises = modifiedProducts.map(async (p) => {
        return supabase
          .from("products")
          .update({
            is_on_sale: p.is_on_sale,
            price: p.price,
            compare_at_price: p.compare_at_price,
            is_active: p.is_active,
          })
          .eq("id", p.id);
      });

      const results = await Promise.all(updatePromises);
      const errors = results.filter((r) => r.error);

      if (errors.length > 0) {
        console.error("Errors saving some products:", errors);
        toast.error(`Failed to save some changes: ${errors[0].error?.message}`);
      } else {
        toast.success("Sales settings saved successfully!");
        setOriginalProducts(JSON.parse(JSON.stringify(products)));
      }
    } catch (err) {
      console.error("Save failed:", err);
      toast.error("An error occurred while saving. Unsaved state is kept.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to discard all unsaved edits?")) {
      setProducts(JSON.parse(JSON.stringify(originalProducts)));
    }
  };

  // Filter products list based on inputs
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory =
        !selectedCategory || p.category_id === selectedCategory;

      const matchesSale =
        saleFilter === "all" ||
        (saleFilter === "sale" && p.is_on_sale) ||
        (saleFilter === "regular" && !p.is_on_sale);

      return matchesSearch && matchesCategory && matchesSale;
    });
  }, [products, searchTerm, selectedCategory, saleFilter]);

  const formatPKR = (amount: number | null) => {
    if (amount === null) return "—";
    return Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Count items on sale
  const saleProductsCount = useMemo(() => {
    return products.filter((p) => p.is_on_sale).length;
  }, [products]);

  return (
    <div className={styles.pageLayout}>
      {/* Title section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 className="font-headline text-2xl font-bold text-admin-text m-0">Sales Manager</h2>
          <p className="font-body text-xs text-admin-text-sub m-0 mt-1">
            Put items on sale, set discount prices, and manage homepage promotions. Currently On Sale: <strong>{saleProductsCount}</strong> items.
          </p>
        </div>
        {hasUnsavedChanges && (
          <div style={{ display: "flex", gap: "12px" }}>
            <Button onClick={handleReset} variant="outline" size="sm">
              Discard Changes ({modifiedProducts.length})
            </Button>
            <Button onClick={handleSaveChanges} variant="luxury" size="sm" isLoading={saving}>
              Save Sales Settings
            </Button>
          </div>
        )}
      </div>

      {/* Filter and Bulk Edit panel */}
      <div className={styles.tableCard} style={{ padding: "20px", marginBottom: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "20px" }}>
          {/* Search */}
          <div className={styles.formGroup} style={{ margin: 0 }}>
            <label className={styles.formLabel}>Search Product</label>
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
              style={{ width: "100%", height: "40px" }}
            />
          </div>

          {/* Category Filter */}
          <div className={styles.formGroup} style={{ margin: 0 }}>
            <label className={styles.formLabel}>Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={styles.formSelect}
              style={{ width: "100%", height: "40px" }}
            >
              <option value="" className={styles.filterOption}>All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className={styles.filterOption}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sale Filter */}
          <div className={styles.formGroup} style={{ margin: 0 }}>
            <label className={styles.formLabel}>Promotion Status</label>
            <select
              value={saleFilter}
              onChange={(e) => setSaleFilter(e.target.value as any)}
              className={styles.formSelect}
              style={{ width: "100%", height: "40px" }}
            >
              <option value="all" className={styles.filterOption}>All Products</option>
              <option value="sale" className={styles.filterOption}>On Sale Only</option>
              <option value="regular" className={styles.filterOption}>Regular Price Only</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Controls */}
        <div style={{ display: "flex", alignItems: "center", justifyItems: "center", gap: "16px", paddingTop: "15px", borderTop: "1px solid var(--admin-border)" }}>
          <span className="font-body text-xs font-bold text-admin-text-sub" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Bulk Actions (For Active Sales Items):
          </span>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              type="number"
              placeholder="e.g. 20"
              value={bulkDiscountPercent}
              onChange={(e) => setBulkDiscountPercent(e.target.value)}
              className={styles.searchInput}
              style={{ width: "80px", height: "32px", fontSize: "12px", textAlign: "center" }}
              min="1"
              max="100"
            />
            <span className="font-body text-sm text-admin-text">% Off</span>
            <Button onClick={handleBulkDiscount} variant="luxury" size="sm">
              Apply Discount
            </Button>
            <Button onClick={handleBulkRemoveSale} variant="outline" size="sm">
              Remove Selected From Sale
            </Button>
          </div>
        </div>
      </div>

      {/* Main product checklist table */}
      {loading ? (
        <p className="font-body text-sm text-admin-text-sub text-center py-12">Loading products catalog...</p>
      ) : filteredProducts.length === 0 ? (
        <div className={styles.tableCard} style={{ padding: "48px", textAlign: "center" }}>
          No products match the selected criteria.
        </div>
      ) : (
        <div className={styles.tableCard}>
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.tableTh} style={{ width: "80px", textAlign: "center" }}>On Sale</th>
                  <th className={styles.tableTh}>Product</th>
                  <th className={styles.tableTh}>SKU</th>
                  <th className={styles.tableTh} style={{ width: "160px" }}>Compare At (Original)</th>
                  <th className={styles.tableTh} style={{ width: "160px" }}>Sale Price (Active)</th>
                  <th className={styles.tableTh} style={{ width: "100px", textAlign: "center" }}>Save %</th>
                  <th className={styles.tableTh} style={{ width: "100px", textAlign: "center" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const primaryImage = p.images?.find((img) => img.is_primary) || p.images?.[0];
                  
                  // Calculate dynamic discount percentage for UI presentation helper
                  const originalPrice = p.compare_at_price || p.price;
                  const discountPercent = p.is_on_sale && p.compare_at_price && p.compare_at_price > p.price
                    ? Math.round(((p.compare_at_price - p.price) / p.compare_at_price) * 100)
                    : 0;

                  return (
                    <tr key={p.id} className={styles.tableTr} style={{ backgroundColor: p.is_on_sale ? "rgba(212, 175, 55, 0.03)" : "transparent" }}>
                      {/* Checkbox toggle column */}
                      <td className={styles.tableTd} style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={p.is_on_sale}
                          onChange={(e) => handleProductChange(p.id, "is_on_sale", e.target.checked)}
                          style={{
                            width: "18px",
                            height: "18px",
                            cursor: "pointer",
                            accentColor: "var(--color-gold)",
                          }}
                        />
                      </td>

                      {/* Product details */}
                      <td className={styles.tableTd}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ position: "relative", width: "40px", aspectRatio: "3/4", backgroundColor: "var(--color-bg)", borderRadius: "var(--radius-sm)", overflow: "hidden", flexShrink: 0 }}>
                            {primaryImage ? (
                              <Image
                                src={primaryImage.url}
                                alt={primaryImage.alt_text || p.name}
                                fill
                                sizes="40px"
                                style={{ objectFit: "cover" }}
                              />
                            ) : (
                              <div style={{ width: "100%", height: "100%", backgroundColor: "var(--color-bg-hover)" }} />
                            )}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span className={styles.tableTdHighlight}>{p.name}</span>
                            <span style={{ fontSize: "11px", color: "var(--admin-text-sub)" }}>{p.category?.name || "Uncategorized"}</span>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className={styles.tableTd}>
                        <span className={styles.dateBadge} style={{ padding: "4px 8px" }}>{p.sku || "N/A"}</span>
                      </td>

                      {/* Compare price input */}
                      <td className={styles.tableTd}>
                        <input
                          type="number"
                          value={p.compare_at_price === null ? "" : p.compare_at_price}
                          placeholder={p.is_on_sale ? "Original Price" : "N/A"}
                          onChange={(e) =>
                            handleProductChange(
                              p.id,
                              "compare_at_price",
                              e.target.value === "" ? null : Number(e.target.value)
                            )
                          }
                          className={styles.searchInput}
                          style={{
                            width: "100%",
                            height: "32px",
                            fontSize: "13px",
                            borderColor: p.is_on_sale && !p.compare_at_price ? "var(--color-gold)" : "var(--admin-border)"
                          }}
                        />
                      </td>

                      {/* Sale price input */}
                      <td className={styles.tableTd}>
                        <input
                          type="number"
                          value={p.price}
                          onChange={(e) => handleProductChange(p.id, "price", Number(e.target.value))}
                          className={styles.searchInput}
                          style={{
                            width: "100%",
                            height: "32px",
                            fontSize: "13px",
                            fontWeight: "bold",
                            color: p.is_on_sale ? "var(--color-gold)" : "inherit"
                          }}
                          min="0"
                          required
                        />
                      </td>

                      {/* Calculated discount label */}
                      <td className={styles.tableTd} style={{ textAlign: "center" }}>
                        {discountPercent > 0 ? (
                          <span style={{ color: "var(--color-gold)", fontWeight: "bold", fontSize: "13px" }}>
                            {discountPercent}% Off
                          </span>
                        ) : (
                          <span style={{ color: "var(--admin-text-sub)", fontSize: "13px" }}>—</span>
                        )}
                      </td>

                      {/* Active storefront visibility toggle */}
                      <td className={styles.tableTd} style={{ textAlign: "center" }}>
                        <button
                          onClick={() => handleProductChange(p.id, "is_active", !p.is_active)}
                          className={`${styles.badge} ${
                            p.is_active ? styles.badgeActive : styles.badgeDraft
                          }`}
                          style={{ border: "0", cursor: "pointer" }}
                        >
                          {p.is_active ? "ACTIVE" : "DRAFT"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Save changes sticky banner at bottom */}
      {hasUnsavedChanges && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            backgroundColor: "var(--admin-sidebar)",
            border: "1px solid var(--color-gold)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            padding: "16px 24px",
            borderRadius: "var(--radius-md)",
            display: "flex",
            alignItems: "center",
            gap: "24px",
            zIndex: 100,
            animation: "slideInUp 0.3s ease-out",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "14px", fontWeight: "bold", color: "#ffffff" }}>
              Unsaved Changes Detected!
            </span>
            <span style={{ fontSize: "11px", color: "var(--admin-text-sub)" }}>
              Modified products: <strong>{modifiedProducts.length}</strong> items.
            </span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <Button onClick={handleReset} variant="outline" size="sm">
              Discard
            </Button>
            <Button onClick={handleSaveChanges} variant="luxury" size="sm" isLoading={saving}>
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
