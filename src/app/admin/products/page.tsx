"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Product, Category } from "@/types";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/storefront/Button/Button";
import { isBeddingProduct } from "@/lib/bedsheet-ar/is-bedding";
import styles from "../admin.module.css";

const adminProductSearchCache = new Map<string, Product[]>();

function AdminProductsContent() {
  const supabase = createClient();
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read initial states from URL query parameters
  const initialSearch = searchParams.get("q") || "";
  const initialStatus = (searchParams.get("status") as "all" | "active" | "draft") || "all";
  const initialCategory = searchParams.get("category") || "all";
  const initialStock = (searchParams.get("stock") as "all" | "in_stock" | "low_stock" | "out_of_stock") || "all";
  const initialSortField = (searchParams.get("sort") as "name" | "price" | "stock" | "created_at") || "created_at";
  const initialSortOrder = (searchParams.get("order") as "asc" | "desc") || "desc";
  const initialPage = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const initialPerPage = Math.max(1, parseInt(searchParams.get("perPage") || "15", 10) || 15);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft">(initialStatus);
  const [categoryFilter, setCategoryFilter] = useState<string>(initialCategory);
  const [stockFilter, setStockFilter] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">(initialStock);
  const [loading, setLoading] = useState(true);

  // Sorting state
  const [sortField, setSortField] = useState<"name" | "price" | "stock" | "created_at">(initialSortField);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(initialSortOrder);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = useState(initialPerPage);

  // Sync state if user clicks browser back/forward buttons
  useEffect(() => {
    const qParam = searchParams.get("q") || "";
    const statusParam = (searchParams.get("status") as "all" | "active" | "draft") || "all";
    const categoryParam = searchParams.get("category") || "all";
    const stockParam = (searchParams.get("stock") as "all" | "in_stock" | "low_stock" | "out_of_stock") || "all";
    const sortParam = (searchParams.get("sort") as "name" | "price" | "stock" | "created_at") || "created_at";
    const orderParam = (searchParams.get("order") as "asc" | "desc") || "desc";
    const pageParam = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const perPageParam = Math.max(1, parseInt(searchParams.get("perPage") || "15", 10) || 15);

    setSearchTerm(qParam);
    setStatusFilter(statusParam);
    setCategoryFilter(categoryParam);
    setStockFilter(stockParam);
    setSortField(sortParam);
    setSortOrder(orderParam);
    setCurrentPage(pageParam);
    setItemsPerPage(perPageParam);
  }, [searchParams]);

  // Update URL search parameters without page scroll jump
  const updateUrlParams = useCallback(
    (updates: {
      q?: string;
      status?: "all" | "active" | "draft";
      category?: string;
      stock?: "all" | "in_stock" | "low_stock" | "out_of_stock";
      sort?: "name" | "price" | "stock" | "created_at";
      order?: "asc" | "desc";
      page?: number;
      perPage?: number;
    }) => {
      const params = new URLSearchParams();

      const nextSearch = updates.q !== undefined ? updates.q : searchTerm;
      const nextStatus = updates.status !== undefined ? updates.status : statusFilter;
      const nextCategory = updates.category !== undefined ? updates.category : categoryFilter;
      const nextStock = updates.stock !== undefined ? updates.stock : stockFilter;
      const nextSort = updates.sort !== undefined ? updates.sort : sortField;
      const nextOrder = updates.order !== undefined ? updates.order : sortOrder;
      const nextPage = updates.page !== undefined ? updates.page : currentPage;
      const nextPerPage = updates.perPage !== undefined ? updates.perPage : itemsPerPage;

      if (nextSearch.trim()) params.set("q", nextSearch.trim());
      if (nextStatus !== "all") params.set("status", nextStatus);
      if (nextCategory !== "all") params.set("category", nextCategory);
      if (nextStock !== "all") params.set("stock", nextStock);
      if (nextSort !== "created_at") params.set("sort", nextSort);
      if (nextOrder !== "desc") params.set("order", nextOrder);
      if (nextPage > 1) params.set("page", String(nextPage));
      if (nextPerPage !== 15) params.set("perPage", String(nextPerPage));

      const queryStr = params.toString();
      const targetUrl = queryStr ? `${pathname}?${queryStr}` : pathname;
      router.replace(targetUrl, { scroll: false });
    },
    [pathname, router, searchTerm, statusFilter, categoryFilter, stockFilter, sortField, sortOrder, currentPage, itemsPerPage]
  );

  const getProductStock = (p: Product) => {
    if (!p.variants || p.variants.length === 0) return 0;
    return p.variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
  };

  useEffect(() => {
    const fetchProductsAndCategories = async () => {
      try {
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("*, category:categories(*), images:product_images(*), variants:product_variants(*)")
          .order("created_at", { ascending: false });

        if (productsError || !productsData) {
          setProducts([]);
        } else {
          setProducts(productsData as Product[]);
        }

        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categories")
          .select("*")
          .order("name", { ascending: true });

        if (!categoriesError && categoriesData) {
          setCategories(categoriesData as Category[]);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProductsAndCategories();
  }, [supabase]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) {
        toast.error(`Failed to delete: ${error.message}`);
      } else {
        await fetch("/api/revalidate?tag=products").catch(() => {});
        await fetch("/api/revalidate?tag=categories").catch(() => {});

        setProducts((prev) => prev.filter((p) => p.id !== id));
        adminProductSearchCache.clear();
        toast.success("Product deleted successfully!");
      }
    } catch {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Product deleted successfully!");
    }
  };

  const handleSort = (field: "name" | "price" | "stock" | "created_at") => {
    let nextOrder: "asc" | "desc" = "desc";
    if (sortField === field) {
      nextOrder = sortOrder === "asc" ? "desc" : "asc";
    } else {
      nextOrder = field === "name" ? "asc" : "desc";
    }
    setSortField(field);
    setSortOrder(nextOrder);
    setCurrentPage(1);
    updateUrlParams({ sort: field, order: nextOrder, page: 1 });
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
    updateUrlParams({ q: val, page: 1 });
  };

  const handleStatusChange = (val: "all" | "active" | "draft") => {
    setStatusFilter(val);
    setCurrentPage(1);
    updateUrlParams({ status: val, page: 1 });
  };

  const handleCategoryChange = (val: string) => {
    setCategoryFilter(val);
    setCurrentPage(1);
    updateUrlParams({ category: val, page: 1 });
  };

  const handleStockChange = (val: "all" | "in_stock" | "low_stock" | "out_of_stock") => {
    setStockFilter(val);
    setCurrentPage(1);
    updateUrlParams({ stock: val, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    updateUrlParams({ page: newPage });
  };

  const resetAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setStockFilter("all");
    setCurrentPage(1);
    updateUrlParams({
      q: "",
      status: "all",
      category: "all",
      stock: "all",
      page: 1,
    });
  };

  // Cached Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    const cleanSearch = searchTerm.trim().toLowerCase();
    const cacheKey = JSON.stringify({
      search: cleanSearch,
      status: statusFilter,
      category: categoryFilter,
      stock: stockFilter,
      sortField,
      sortOrder,
      totalLength: products.length,
    });

    if (adminProductSearchCache.has(cacheKey)) {
      return adminProductSearchCache.get(cacheKey)!;
    }

    let result = [...products];

    // Status filter
    if (statusFilter === "active") {
      result = result.filter((p) => p.is_active);
    } else if (statusFilter === "draft") {
      result = result.filter((p) => !p.is_active);
    }

    // Category filter
    if (categoryFilter !== "all") {
      result = result.filter((p) => p.category_id === categoryFilter || p.category?.slug === categoryFilter);
    }

    // Stock filter
    if (stockFilter === "in_stock") {
      result = result.filter((p) => getProductStock(p) > 0);
    } else if (stockFilter === "low_stock") {
      result = result.filter((p) => {
        const s = getProductStock(p);
        return s > 0 && s <= 5;
      });
    } else if (stockFilter === "out_of_stock") {
      result = result.filter((p) => getProductStock(p) === 0);
    }

    // Search filter
    if (cleanSearch) {
      result = result.filter((p) => {
        const matchName = p.name?.toLowerCase().includes(cleanSearch);
        const matchSku = p.sku?.toLowerCase().includes(cleanSearch);
        const matchBarcode = p.barcode?.toLowerCase().includes(cleanSearch);
        const matchFabric = p.fabric?.toLowerCase().includes(cleanSearch);
        const matchCategory = p.category?.name?.toLowerCase().includes(cleanSearch);
        return matchName || matchSku || matchBarcode || matchFabric || matchCategory;
      });
    }

    // Sort logic
    const modifier = sortOrder === "asc" ? 1 : -1;
    if (sortField === "stock") {
      result.sort((a, b) => (getProductStock(a) - getProductStock(b)) * modifier);
    } else if (sortField === "price") {
      result.sort((a, b) => (a.price - b.price) * modifier);
    } else if (sortField === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name) * modifier);
    } else if (sortField === "created_at") {
      result.sort((a, b) => (new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) * modifier);
    }

    if (adminProductSearchCache.size > 50) {
      const firstKey = adminProductSearchCache.keys().next().value;
      if (firstKey) adminProductSearchCache.delete(firstKey);
    }
    adminProductSearchCache.set(cacheKey, result);

    return result;
  }, [products, searchTerm, statusFilter, categoryFilter, stockFilter, sortField, sortOrder]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredProducts.length);
  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, startIndex, endIndex]);

  const formatPKR = (amount: number) => {
    return Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.is_active).length;
    const totalStock = products.reduce((acc, p) => acc + getProductStock(p), 0);
    const outOfStockCount = products.filter((p) => getProductStock(p) === 0).length;
    const lowStockCount = products.filter((p) => {
      const s = getProductStock(p);
      return s > 0 && s <= 5;
    }).length;
    return { total, active, totalStock, outOfStockCount, lowStockCount };
  }, [products]);

  const isAnyFilterActive = Boolean(
    searchTerm || statusFilter !== "all" || categoryFilter !== "all" || stockFilter !== "all"
  );

  const resetAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setStockFilter("all");
  };

  return (
    <div className={styles.pageLayout}>
      {/* Top Header & New Button */}
      <div className={styles.tableHeader} style={{ marginBottom: "8px" }}>
        <div>
          <h1 className={styles.tableTitle} style={{ fontSize: "24px", marginBottom: "4px" }}>
            Product Catalog
          </h1>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--admin-text-sub)" }}>
            Manage and track inventory, prices, variants, categories, and AR status.
          </p>
        </div>

        <Link href="/admin/products/new">
          <Button variant="luxury">+ Add New Product</Button>
        </Link>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className={styles.dashboardGrid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardMeta}>
              <span className={styles.cardLabel}>Total Products</span>
              <span className={styles.cardValue} style={{ fontSize: "28px", fontWeight: 700, marginTop: "4px" }}>
                {stats.total}
              </span>
            </div>
            <div className={`${styles.cardIcon} ${styles.cardIconGold}`}>🏷️</div>
          </div>
          <span style={{ fontSize: "12px", color: "var(--admin-text-sub)" }}>
            {stats.active} published active
          </span>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardMeta}>
              <span className={styles.cardLabel}>Total Units in Stock</span>
              <span className={styles.cardValue} style={{ fontSize: "28px", fontWeight: 700, marginTop: "4px", color: "var(--color-gold)" }}>
                {stats.totalStock}
              </span>
            </div>
            <div className={`${styles.cardIcon} ${styles.cardIconGold}`}>📦</div>
          </div>
          <span style={{ fontSize: "12px", color: "var(--admin-text-sub)" }}>
            Across all variant sizes
          </span>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardMeta}>
              <span className={styles.cardLabel}>Low Stock Alert</span>
              <span className={styles.cardValue} style={{ fontSize: "28px", fontWeight: 700, marginTop: "4px", color: stats.lowStockCount > 0 ? "#f59e0b" : "var(--admin-text)" }}>
                {stats.lowStockCount}
              </span>
            </div>
            <div className={`${styles.cardIcon} ${styles.cardIconMuted}`}>⚡</div>
          </div>
          <span style={{ fontSize: "12px", color: "var(--admin-text-sub)" }}>
            ≤ 5 units remaining
          </span>
        </div>

        <div
          className={styles.card}
          onClick={() => setStockFilter(stockFilter === "out_of_stock" ? "all" : "out_of_stock")}
          style={{
            cursor: "pointer",
            borderColor: stockFilter === "out_of_stock" ? "var(--color-error)" : undefined,
          }}
          title="Click to toggle Out of Stock filter"
        >
          <div className={styles.cardHeader}>
            <div className={styles.cardMeta}>
              <span className={styles.cardLabel}>Out of Stock</span>
              <span
                className={styles.cardValue}
                style={{
                  fontSize: "28px",
                  fontWeight: 700,
                  marginTop: "4px",
                  color: stats.outOfStockCount > 0 ? "var(--color-error, #ef4444)" : "var(--admin-text-sub)",
                }}
              >
                {stats.outOfStockCount}
              </span>
            </div>
            <div className={`${styles.cardIcon} ${styles.cardIconMuted}`} style={{ color: stats.outOfStockCount > 0 ? "#ef4444" : undefined }}>
              ⚠️
            </div>
          </div>
          <span style={{ fontSize: "12px", color: stockFilter === "out_of_stock" ? "var(--color-gold)" : "var(--admin-text-sub)" }}>
            {stockFilter === "out_of_stock" ? "Showing Out of Stock (Filtered)" : "Click to view out of stock"}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={styles.filterContainer}>
        {/* Instant Search Box */}
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search by product name, SKU, barcode, fabric..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className={styles.searchInput}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              style={{
                background: "none",
                border: "none",
                color: "var(--admin-text-sub)",
                cursor: "pointer",
                padding: "2px",
                display: "flex",
                alignItems: "center",
              }}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Stock Filter */}
          <div className={styles.filterWrapper}>
            <span className={styles.filterLabel}>Stock:</span>
            <select
              value={stockFilter}
              onChange={(e) => handleStockChange(e.target.value as any)}
              className={styles.filterSelect}
            >
              <option value="all" className={styles.filterOption}>All Inventory</option>
              <option value="in_stock" className={styles.filterOption}>In Stock (&gt;0)</option>
              <option value="low_stock" className={styles.filterOption}>Low Stock (≤5)</option>
              <option value="out_of_stock" className={styles.filterOption}>Out of Stock (0)</option>
            </select>
          </div>

          {/* Collection / Category Filter */}
          {categories.length > 0 && (
            <div className={styles.filterWrapper}>
              <span className={styles.filterLabel}>Collection:</span>
              <select
                value={categoryFilter}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all" className={styles.filterOption}>All Collections</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className={styles.filterOption}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div className={styles.filterWrapper}>
            <span className={styles.filterLabel}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value as any)}
              className={styles.filterSelect}
            >
              <option value="all" className={styles.filterOption}>All Statuses</option>
              <option value="active" className={styles.filterOption}>Active Only</option>
              <option value="draft" className={styles.filterOption}>Drafts Only</option>
            </select>
          </div>

          {isAnyFilterActive && (
            <button
              type="button"
              onClick={resetAllFilters}
              className={styles.signOutButton}
              style={{ width: "auto", padding: "8px 14px", height: "38px" }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      {loading ? (
        <div className={styles.tableCard} style={{ padding: "48px", textAlign: "center" }}>
          <p className="font-body text-sm text-admin-text-sub">Loading products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className={styles.tableCard} style={{ padding: "56px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>📦</div>
          <h3 style={{ color: "var(--admin-text)", fontSize: "16px", fontWeight: 600, margin: "0 0 8px" }}>
            No products match your search or filter criteria.
          </h3>
          <p style={{ color: "var(--admin-text-sub)", fontSize: "13px", margin: "0 0 16px" }}>
            Try resetting your filters or adjusting your keywords.
          </p>
          <button
            type="button"
            onClick={resetAllFilters}
            className={styles.topbarButton}
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className={styles.tableCard}>
          {/* Table Header Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: "16px",
              borderBottom: "1px solid var(--admin-border)",
              marginBottom: "8px",
              fontSize: "13px",
              color: "var(--admin-text-sub)",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div>
              Showing <strong>{startIndex + 1}–{endIndex}</strong> of <strong>{filteredProducts.length}</strong> products
              {products.length !== filteredProducts.length && ` (filtered from ${products.length} total)`}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>Show per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className={styles.filterSelect}
                style={{ padding: "4px 8px", fontSize: "12px" }}
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th
                    className={styles.tableTh}
                    onClick={() => handleSort("name")}
                    style={{ cursor: "pointer", userSelect: "none" }}
                    title="Click to sort by product name"
                  >
                    Product
                    {sortField === "name" && (
                      <span style={{ color: "var(--color-gold)", marginLeft: "4px" }}>
                        {sortOrder === "asc" ? " ▲" : " ▼"}
                      </span>
                    )}
                  </th>
                  <th className={styles.tableTh} style={{ minWidth: "110px", whiteSpace: "nowrap" }}>SKU</th>
                  <th className={styles.tableTh} style={{ minWidth: "130px", whiteSpace: "nowrap" }}>Collection</th>
                  <th
                    className={styles.tableTh}
                    onClick={() => handleSort("price")}
                    style={{ cursor: "pointer", userSelect: "none", minWidth: "110px", whiteSpace: "nowrap" }}
                    title="Click to sort by price"
                  >
                    Price
                    {sortField === "price" && (
                      <span style={{ color: "var(--color-gold)", marginLeft: "4px" }}>
                        {sortOrder === "asc" ? " ▲" : " ▼"}
                      </span>
                    )}
                  </th>
                  <th
                    className={styles.tableTh}
                    onClick={() => handleSort("stock")}
                    style={{ cursor: "pointer", userSelect: "none", minWidth: "130px", whiteSpace: "nowrap" }}
                    title="Click to sort by total stock"
                  >
                    Stock Units
                    {sortField === "stock" && (
                      <span style={{ color: "var(--color-gold)", marginLeft: "4px" }}>
                        {sortOrder === "asc" ? " ▲" : " ▼"}
                      </span>
                    )}
                  </th>
                  <th className={styles.tableTh} style={{ minWidth: "100px", whiteSpace: "nowrap" }}>Status</th>
                  <th className={styles.tableTh} style={{ textAlign: "right", minWidth: "220px", whiteSpace: "nowrap" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((p) => {
                  const primaryImage =
                    p.images?.find((img) => img.is_primary) || p.images?.[0];

                  const categoryParent = p.category?.parent_id
                    ? categories.find((c) => c.id === p.category?.parent_id)
                    : null;

                  const totalStock = getProductStock(p);
                  const variantCount = p.variants?.length || 0;

                  return (
                    <tr key={p.id} className={styles.tableTr}>
                      {/* Product Thumbnail & Details */}
                      <td className={styles.tableTd} style={{ minWidth: "200px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div
                            style={{
                              position: "relative",
                              width: "40px",
                              aspectRatio: "3/4",
                              backgroundColor: "var(--admin-bg)",
                              borderRadius: "var(--radius-sm)",
                              overflow: "hidden",
                              border: "1px solid var(--admin-border)",
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
                              <div style={{ width: "100%", height: "100%", backgroundColor: "var(--color-bg-hover)" }} />
                            )}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                            <span className={styles.tableTdHighlight} style={{ fontSize: "13px" }}>
                              {p.name}
                            </span>
                            {p.fabric && (
                              <span style={{ fontSize: "11px", color: "var(--admin-text-sub)" }}>
                                {p.fabric}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className={styles.tableTd} style={{ whiteSpace: "nowrap" }}>
                        <span
                          className={styles.dateBadge}
                          style={{
                            padding: "2px 6px",
                            fontSize: "11px",
                            fontFamily: "monospace",
                            letterSpacing: "0.3px",
                            display: "inline-block",
                          }}
                        >
                          {p.sku || "—"}
                        </span>
                      </td>

                      {/* Collection & Child Category on next line */}
                      <td className={styles.tableTd} style={{ whiteSpace: "nowrap" }}>
                        {p.category ? (
                          categoryParent ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                              <span style={{ fontSize: "11px", color: "var(--admin-text-sub)" }}>
                                {categoryParent.name}
                              </span>
                              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--admin-text)" }}>
                                {p.category.name}
                              </span>
                            </div>
                          ) : (
                            <span style={{ fontSize: "12px", color: "var(--admin-text)" }}>
                              {p.category.name}
                            </span>
                          )
                        ) : (
                          <span style={{ fontSize: "11px", color: "var(--admin-text-sub)" }}>Unassigned</span>
                        )}
                      </td>

                      {/* Price */}
                      <td className={`${styles.tableTd} ${styles.tableTdHighlight}`} style={{ color: "var(--color-gold)", whiteSpace: "nowrap" }}>
                        {formatPKR(p.price)}
                      </td>

                      {/* Stock Level Badge */}
                      <td className={styles.tableTd} style={{ whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px", alignItems: "flex-start" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              lineHeight: 1,
                              whiteSpace: "nowrap",
                              backgroundColor:
                                totalStock === 0
                                  ? "rgba(239, 68, 68, 0.15)"
                                  : totalStock <= 5
                                  ? "rgba(245, 158, 11, 0.15)"
                                  : "rgba(34, 197, 94, 0.15)",
                              color:
                                totalStock === 0
                                  ? "#ef4444"
                                  : totalStock <= 5
                                  ? "#f59e0b"
                                  : "#22c55e",
                              border:
                                totalStock === 0
                                  ? "1px solid rgba(239, 68, 68, 0.3)"
                                  : totalStock <= 5
                                  ? "1px solid rgba(245, 158, 11, 0.3)"
                                  : "1px solid rgba(34, 197, 94, 0.3)",
                              fontSize: "11px",
                              fontWeight: 600,
                              padding: "4px 8px",
                              borderRadius: "4px",
                            }}
                          >
                            <span
                              style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                backgroundColor:
                                  totalStock === 0 ? "#ef4444" : totalStock <= 5 ? "#f59e0b" : "#22c55e",
                                display: "inline-block",
                                flexShrink: 0,
                              }}
                            />
                            {totalStock === 0
                              ? "Out of Stock"
                              : totalStock <= 5
                              ? `${totalStock} units (Low)`
                              : `${totalStock} in stock`}
                          </span>
                          {variantCount > 1 && (
                            <span style={{ fontSize: "10px", color: "var(--admin-text-sub)" }}>
                              Across {variantCount} variants
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className={styles.tableTd} style={{ whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: 700,
                            letterSpacing: "0.5px",
                            lineHeight: 1,
                            backgroundColor: p.is_active ? "var(--color-success-bg)" : "var(--color-border-subtle)",
                            color: p.is_active ? "var(--color-success)" : "var(--admin-text-sub)",
                          }}
                        >
                          {p.is_active ? "ACTIVE" : "DRAFT"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className={styles.tableTd} style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <div
                          style={{
                            display: "inline-flex",
                            gap: "12px",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <a
                            href={`/product/${p.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.tableLink}
                            style={{ color: "#38bdf8", fontSize: "12px", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: "2px" }}
                          >
                            Preview ↗
                          </a>
                          <Link
                            href={`/admin/products/${p.id}`}
                            className={styles.tableLink}
                            style={{ fontSize: "12px", whiteSpace: "nowrap" }}
                          >
                            Edit
                          </Link>
                          {isBeddingProduct(p, categories) && (
                            <Link
                              href={`/admin/products/${p.id}/bedsheet-ar`}
                              className={styles.tableLink}
                              style={{ color: "var(--color-gold)", fontSize: "12px", whiteSpace: "nowrap" }}
                            >
                              AR Config
                            </Link>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--color-error, #ef4444)",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: "pointer",
                              padding: 0,
                              whiteSpace: "nowrap",
                            }}
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

          {/* Table Pagination Controls */}
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: "16px",
                marginTop: "16px",
                borderTop: "1px solid var(--admin-border)",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div style={{ fontSize: "13px", color: "var(--admin-text-sub)" }}>
                Page {currentPage} of {totalPages}
              </div>

              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  type="button"
                  className={styles.topbarButton}
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  style={{ opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
                >
                  ‹ Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((pageNum, idx, arr) => {
                    const showEllipsis = idx > 0 && pageNum - arr[idx - 1] > 1;
                    return (
                      <React.Fragment key={pageNum}>
                        {showEllipsis && (
                          <span style={{ padding: "6px 4px", color: "var(--admin-text-sub)" }}>…</span>
                        )}
                        <button
                          type="button"
                          onClick={() => handlePageChange(pageNum)}
                          style={{
                            padding: "6px 12px",
                            fontSize: "12px",
                            borderRadius: "var(--radius-sm)",
                            border: pageNum === currentPage ? "1px solid var(--color-gold)" : "1px solid var(--admin-border)",
                            backgroundColor: pageNum === currentPage ? "var(--color-gold)" : "transparent",
                            color: pageNum === currentPage ? "#1c1b1b" : "var(--admin-text)",
                            fontWeight: pageNum === currentPage ? 700 : 500,
                            cursor: "pointer",
                          }}
                        >
                          {pageNum}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <button
                  type="button"
                  className={styles.topbarButton}
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  style={{ opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
                >
                  Next ›
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <React.Suspense fallback={<div className={styles.tableCard} style={{ padding: "48px", textAlign: "center" }}>Loading catalog...</div>}>
      <AdminProductsContent />
    </React.Suspense>
  );
}
