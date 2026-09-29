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

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
          const cleanData = (prodData as Product[]).map((p) => ({
            ...p,
            is_on_sale: p.is_on_sale || false,
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

  // Helper to determine the regular/baseline price before discount
  const getBasePrice = (p: Product): number => {
    if (p.compare_at_price && p.compare_at_price > p.price) {
      return p.compare_at_price;
    }
    return p.price;
  };

  // Helper to apply a discount percentage to a single product
  const applyDiscountToProduct = (p: Product, percent: number): Product => {
    const originalPrice = getBasePrice(p);
    const discountedPrice = Math.max(0, Math.round(originalPrice * (1 - percent / 100)));
    return {
      ...p,
      compare_at_price: originalPrice,
      price: discountedPrice,
      is_on_sale: true,
    };
  };

  // Helper to remove a product from sale and restore original price
  const removeProductFromSale = (p: Product): Product => {
    const restoredPrice =
      p.compare_at_price && p.compare_at_price > p.price ? p.compare_at_price : p.price;
    return {
      ...p,
      price: restoredPrice,
      compare_at_price: null,
      is_on_sale: false,
    };
  };

  // Filter products list based on inputs
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = !selectedCategory || p.category_id === selectedCategory;

      const matchesSale =
        saleFilter === "all" ||
        (saleFilter === "sale" && p.is_on_sale) ||
        (saleFilter === "regular" && !p.is_on_sale);

      return matchesSearch && matchesCategory && matchesSale;
    });
  }, [products, searchTerm, selectedCategory, saleFilter]);

  // Selection handlers
  const allFilteredSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((p) => selectedIds.has(p.id));

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredProducts.forEach((p) => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredProducts.forEach((p) => next.add(p.id));
        return next;
      });
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Bulk apply discount: applies to selected items if any, otherwise all filtered items
  const handleBulkDiscount = (overridePercent?: number) => {
    const percent = overridePercent ?? parseFloat(bulkDiscountPercent);
    if (isNaN(percent) || percent <= 0 || percent >= 100) {
      toast.warning("Please enter a valid discount percentage between 1 and 99.");
      return;
    }

    const hasSelection = selectedIds.size > 0;
    const targetIds = new Set(
      hasSelection
        ? filteredProducts.filter((p) => selectedIds.has(p.id)).map((p) => p.id)
        : filteredProducts.map((p) => p.id)
    );

    if (targetIds.size === 0) {
      toast.warning("No products selected or visible to apply discount to.");
      return;
    }

    setProducts((prev) =>
      prev.map((p) => {
        if (!targetIds.has(p.id)) return p;
        return applyDiscountToProduct(p, percent);
      })
    );

    toast.success(
      `Applied ${percent}% discount to ${targetIds.size} product(s). Compare price added from original price.`
    );
    if (!overridePercent) {
      setBulkDiscountPercent("");
    }
  };

  // Bulk remove from sale: applies to selected items if any, otherwise all filtered on-sale items
  const handleBulkRemoveSale = () => {
    const hasSelection = selectedIds.size > 0;
    const targetIds = new Set(
      hasSelection
        ? filteredProducts.filter((p) => selectedIds.has(p.id)).map((p) => p.id)
        : filteredProducts.filter((p) => p.is_on_sale).map((p) => p.id)
    );

    if (targetIds.size === 0) {
      toast.warning("No on-sale products found to remove.");
      return;
    }

    setProducts((prev) =>
      prev.map((p) => {
        if (!targetIds.has(p.id)) return p;
        return removeProductFromSale(p);
      })
    );

    toast.success(`Removed ${targetIds.size} product(s) from sale and restored original prices.`);
  };

  // Row-level: Toggle On Sale
  const handleToggleSale = (id: string, currentlyOnSale: boolean) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        if (currentlyOnSale) {
          return removeProductFromSale(p);
        } else {
          // If turning on sale, check if bulk discount percent is set, otherwise default to 15%
          const pct = parseFloat(bulkDiscountPercent);
          const effectivePct = !isNaN(pct) && pct > 0 && pct < 100 ? pct : 15;
          return applyDiscountToProduct(p, effectivePct);
        }
      })
    );
  };

  // Row-level: Edit Discount %
  const handleRowDiscountChange = (id: string, newPctStr: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        if (newPctStr === "" || newPctStr === "0") {
          return removeProductFromSale(p);
        }
        const pct = parseFloat(newPctStr);
        if (isNaN(pct) || pct <= 0 || pct >= 100) return p;
        return applyDiscountToProduct(p, pct);
      })
    );
  };

  // Row-level: Edit Compare At Price (Original price)
  const handleRowComparePriceChange = (id: string, rawVal: string) => {
    const val = rawVal === "" ? null : Number(rawVal);
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const newCompare = val === null || isNaN(val) || val <= 0 ? null : val;
        const isOnSale = newCompare !== null && newCompare > p.price;
        return {
          ...p,
          compare_at_price: newCompare,
          is_on_sale: isOnSale,
        };
      })
    );
  };

  // Row-level: Edit Sale Price (Active price)
  const handleRowPriceChange = (id: string, newPrice: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        if (isNaN(newPrice) || newPrice < 0) return p;

        // If compare_at_price is not set yet, and new price is lower than previous price:
        // Automatically add previous price as compare_at_price!
        let updatedCompare = p.compare_at_price;
        if (!updatedCompare && newPrice < p.price) {
          updatedCompare = p.price;
        }

        const isOnSale = updatedCompare !== null && updatedCompare > newPrice;

        return {
          ...p,
          price: newPrice,
          compare_at_price: updatedCompare,
          is_on_sale: isOnSale,
        };
      })
    );
  };

  // Row-level: Toggle active/draft status
  const handleToggleActive = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        return { ...p, is_active: !p.is_active };
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

  // Save changes to Database and revalidate Next.js cache
  const handleSaveChanges = async () => {
    if (modifiedProducts.length === 0) return;
    setSaving(true);

    try {
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
        // Revalidate Next.js cache so storefront updates immediately
        await Promise.allSettled([
          fetch("/api/revalidate?tag=products"),
          fetch("/api/revalidate?tag=categories"),
          fetch("/api/revalidate?path=/"),
          fetch("/api/revalidate?path=/collections"),
        ]);

        toast.success(`Sales settings saved for ${modifiedProducts.length} product(s)!`);
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
      setSelectedIds(new Set());
    }
  };

  const formatPKR = (amount: number | null) => {
    if (amount === null || amount === undefined) return "—";
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

  const targetCount = selectedIds.size > 0 ? selectedIds.size : filteredProducts.length;

  return (
    <div className={styles.pageLayout}>
      {/* Title section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h2 className="font-headline text-2xl font-bold text-admin-text m-0">Sales Manager</h2>
          <p className="font-body text-xs text-admin-text-sub m-0 mt-1">
            Apply discounts, add compare prices (crossed-out original price), and put items on sale.
            Currently on sale:{" "}
            <strong style={{ color: "var(--color-gold)" }}>{saleProductsCount}</strong> items.
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
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
              <option value="" className={styles.filterOption}>
                All Categories
              </option>
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
              <option value="all" className={styles.filterOption}>
                All Products ({products.length})
              </option>
              <option value="sale" className={styles.filterOption}>
                On Sale Only ({saleProductsCount})
              </option>
              <option value="regular" className={styles.filterOption}>
                Regular Price Only ({products.length - saleProductsCount})
              </option>
            </select>
          </div>
        </div>

        {/* Bulk Action Controls */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            paddingTop: "16px",
            borderTop: "1px solid var(--admin-border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                className="font-body text-xs font-bold text-admin-text-sub"
                style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}
              >
                Apply Discount:
              </span>
              {selectedIds.size > 0 ? (
                <span
                  style={{
                    backgroundColor: "var(--color-gold-muted)",
                    color: "var(--color-gold)",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: "bold",
                  }}
                >
                  {selectedIds.size} Selected
                </span>
              ) : (
                <span
                  style={{
                    color: "var(--admin-text-sub)",
                    fontSize: "11px",
                  }}
                >
                  (All {filteredProducts.length} visible)
                </span>
              )}
            </div>

            {/* Quick preset chips */}
            <div style={{ display: "flex", gap: "6px" }}>
              {[10, 15, 20, 25, 30, 50].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setBulkDiscountPercent(pct.toString())}
                  style={{
                    border: "1px solid var(--admin-border)",
                    backgroundColor:
                      bulkDiscountPercent === pct.toString()
                        ? "var(--color-gold)"
                        : "var(--admin-card)",
                    color:
                      bulkDiscountPercent === pct.toString()
                        ? "#000"
                        : "var(--admin-text)",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    cursor: "pointer",
                    fontWeight: "600",
                    transition: "all 0.15s ease",
                  }}
                >
                  {pct}%
                </button>
              ))}
            </div>

            {/* Input & Apply */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="number"
                placeholder="e.g. 20"
                value={bulkDiscountPercent}
                onChange={(e) => setBulkDiscountPercent(e.target.value)}
                className={styles.searchInput}
                style={{ width: "75px", height: "32px", fontSize: "12px", textAlign: "center" }}
                min="1"
                max="99"
              />
              <span className="font-body text-xs text-admin-text">% Off</span>
              <Button
                onClick={() => handleBulkDiscount()}
                variant="luxury"
                size="sm"
                title={`Apply discount to ${targetCount} product(s)`}
              >
                Apply Discount ({targetCount})
              </Button>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--admin-text-sub)",
                  fontSize: "12px",
                  textDecoration: "underline",
                  cursor: "pointer",
                  marginRight: "8px",
                }}
              >
                Clear Selection
              </button>
            )}
            <Button onClick={handleBulkRemoveSale} variant="outline" size="sm">
              Remove from Sale ({targetCount})
            </Button>
          </div>
        </div>
      </div>

      {/* Main product checklist table */}
      {loading ? (
        <p className="font-body text-sm text-admin-text-sub text-center py-12">
          Loading products catalog...
        </p>
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
                  <th className={styles.tableTh} style={{ width: "40px", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={handleToggleSelectAll}
                      style={{
                        width: "16px",
                        height: "16px",
                        cursor: "pointer",
                        accentColor: "var(--color-gold)",
                      }}
                      title="Select / Deselect all visible products"
                    />
                  </th>
                  <th className={styles.tableTh} style={{ width: "90px", textAlign: "center" }}>
                    On Sale
                  </th>
                  <th className={styles.tableTh}>Product</th>
                  <th className={styles.tableTh} style={{ width: "110px" }}>SKU</th>
                  <th className={styles.tableTh} style={{ width: "160px" }}>
                    Compare At (Original)
                  </th>
                  <th className={styles.tableTh} style={{ width: "160px" }}>
                    Sale Price (Active)
                  </th>
                  <th className={styles.tableTh} style={{ width: "120px", textAlign: "center" }}>
                    Discount %
                  </th>
                  <th className={styles.tableTh} style={{ width: "90px", textAlign: "center" }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const primaryImage =
                    p.images?.find((img) => img.is_primary) || p.images?.[0];

                  const isSelected = selectedIds.has(p.id);

                  // Calculate discount percentage if compare_at_price > price
                  const discountPercent =
                    p.compare_at_price && p.compare_at_price > p.price
                      ? Math.round(
                          ((p.compare_at_price - p.price) / p.compare_at_price) * 100
                        )
                      : null;

                  return (
                    <tr
                      key={p.id}
                      className={styles.tableTr}
                      style={{
                        backgroundColor: isSelected
                          ? "rgba(212, 175, 55, 0.08)"
                          : p.is_on_sale
                          ? "rgba(212, 175, 55, 0.03)"
                          : "transparent",
                      }}
                    >
                      {/* Selection checkbox */}
                      <td className={styles.tableTd} style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(p.id)}
                          style={{
                            width: "16px",
                            height: "16px",
                            cursor: "pointer",
                            accentColor: "var(--color-gold)",
                          }}
                        />
                      </td>

                      {/* On Sale toggle */}
                      <td className={styles.tableTd} style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => handleToggleSale(p.id, Boolean(p.is_on_sale))}
                          style={{
                            border: p.is_on_sale
                              ? "1px solid var(--color-gold)"
                              : "1px solid var(--admin-border)",
                            backgroundColor: p.is_on_sale
                              ? "var(--color-gold)"
                              : "transparent",
                            color: p.is_on_sale ? "#000" : "var(--admin-text-sub)",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "bold",
                            cursor: "pointer",
                            letterSpacing: "0.05em",
                            transition: "all 0.15s ease",
                          }}
                          title={
                            p.is_on_sale
                              ? "Click to remove from sale and restore original price"
                              : "Click to put on sale and add compare price"
                          }
                        >
                          {p.is_on_sale ? "ON SALE" : "OFF"}
                        </button>
                      </td>

                      {/* Product details */}
                      <td className={styles.tableTd}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div
                            style={{
                              position: "relative",
                              width: "40px",
                              aspectRatio: "3/4",
                              backgroundColor: "var(--color-bg)",
                              borderRadius: "var(--radius-sm)",
                              overflow: "hidden",
                              flexShrink: 0,
                            }}
                          >
                            {primaryImage ? (
                              <Image
                                src={primaryImage.url}
                                alt={primaryImage.alt_text || p.name}
                                fill
                                sizes="40px"
                                style={{ objectFit: "cover" }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  backgroundColor: "var(--color-bg-hover)",
                                }}
                              />
                            )}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span className={styles.tableTdHighlight}>{p.name}</span>
                            <span style={{ fontSize: "11px", color: "var(--admin-text-sub)" }}>
                              {p.category?.name || "Uncategorized"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className={styles.tableTd}>
                        <span className={styles.dateBadge} style={{ padding: "4px 8px" }}>
                          {p.sku || "N/A"}
                        </span>
                      </td>

                      {/* Compare At (Original Price) */}
                      <td className={styles.tableTd}>
                        <div style={{ position: "relative" }}>
                          <input
                            type="number"
                            value={p.compare_at_price === null ? "" : p.compare_at_price}
                            placeholder={p.is_on_sale ? formatPKR(p.price) : "e.g. 5000"}
                            onChange={(e) => handleRowComparePriceChange(p.id, e.target.value)}
                            className={styles.searchInput}
                            style={{
                              width: "100%",
                              height: "32px",
                              fontSize: "13px",
                              textDecoration:
                                p.compare_at_price && p.compare_at_price > p.price
                                  ? "line-through"
                                  : "none",
                              color:
                                p.compare_at_price && p.compare_at_price > p.price
                                  ? "var(--admin-text-sub)"
                                  : "inherit",
                              borderColor:
                                p.is_on_sale && !p.compare_at_price
                                  ? "var(--color-gold)"
                                  : "var(--admin-border)",
                            }}
                            title="Original/Regular retail price shown crossed-out on storefront"
                            min="0"
                          />
                        </div>
                      </td>

                      {/* Sale Price (Active Selling Price) */}
                      <td className={styles.tableTd}>
                        <input
                          type="number"
                          value={p.price}
                          onChange={(e) => handleRowPriceChange(p.id, Number(e.target.value))}
                          className={styles.searchInput}
                          style={{
                            width: "100%",
                            height: "32px",
                            fontSize: "13px",
                            fontWeight: "bold",
                            color: p.is_on_sale ? "var(--color-gold)" : "inherit",
                          }}
                          min="0"
                          required
                          title="Current active selling price"
                        />
                      </td>

                      {/* Discount % (Editable Input) */}
                      <td className={styles.tableTd} style={{ textAlign: "center" }}>
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            justifyContent: "center",
                          }}
                        >
                          <input
                            type="number"
                            placeholder="—"
                            value={discountPercent !== null ? discountPercent : ""}
                            onChange={(e) => handleRowDiscountChange(p.id, e.target.value)}
                            className={styles.searchInput}
                            style={{
                              width: "55px",
                              height: "30px",
                              fontSize: "12px",
                              textAlign: "center",
                              fontWeight: discountPercent ? "bold" : "normal",
                              color: discountPercent ? "var(--color-gold)" : "inherit",
                              borderColor: discountPercent
                                ? "var(--color-gold)"
                                : "var(--admin-border)",
                            }}
                            min="0"
                            max="99"
                            title="Enter discount % to automatically calculate sale price and add compare price"
                          />
                          <span style={{ fontSize: "11px", color: "var(--admin-text-sub)" }}>%</span>
                        </div>
                      </td>

                      {/* Active storefront visibility toggle */}
                      <td className={styles.tableTd} style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(p.id)}
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
