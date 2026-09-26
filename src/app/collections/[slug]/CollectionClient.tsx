"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Product } from "@/types";
import { ProductCard } from "@/components/storefront/ProductCard/ProductCard";
import { Breadcrumb } from "@/components/storefront/Breadcrumb/Breadcrumb";
import { ListingLayoutSelector } from "@/components/storefront/ListingLayoutSelector/ListingLayoutSelector";
import { useListingLayoutPreference } from "@/components/storefront/useListingLayoutPreference";
import { productToAnalyticsItem, trackEcommerceEvent } from "@/lib/analytics";
import styles from "./CollectionClient.module.css";

const normalizeFabricName = (name: string): string => {
  if (!name) return "";
  const trimmed = name.trim();
  return trimmed
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const collectionSearchCache = new Map<string, Product[]>();

interface CollectionClientProps {
  initialProducts: Product[];
  categoryName: string;
  categorySlug: string;
}

export const CollectionClient: React.FC<CollectionClientProps> = ({
  initialProducts,
  categoryName,
  categorySlug,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read initial states from URL search params
  const initialSearch = searchParams.get("q") || "";
  const initialFabrics = searchParams.get("fabric")
    ? searchParams.get("fabric")!.split(",").filter(Boolean)
    : [];
  const initialSizes = searchParams.get("size")
    ? searchParams.get("size")!.split(",").filter(Boolean)
    : [];
  const initialInStock = searchParams.get("inStock") === "true";
  const initialSort = searchParams.get("sort") || "newest";
  const initialPage = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const initialPerPage = Math.max(1, parseInt(searchParams.get("perPage") || "12", 10) || 12);

  const { layout, setLayout } = useListingLayoutPreference();
  const [searchTerm, setSearchTerm] = useState<string>(initialSearch);
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>(initialFabrics);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(initialSizes);
  const [inStockOnly, setInStockOnly] = useState<boolean>(initialInStock);
  const [sortBy, setSortBy] = useState<string>(initialSort);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [itemsPerPage, setItemsPerPage] = useState<number>(initialPerPage);
  const [isMobileFiltersExpanded, setIsMobileFiltersExpanded] = useState<boolean>(false);

  const gridSectionRef = useRef<HTMLDivElement | null>(null);

  // Sync state if user navigates with browser Back / Forward buttons
  useEffect(() => {
    const qParam = searchParams.get("q") || "";
    const fabricParam = searchParams.get("fabric")
      ? searchParams.get("fabric")!.split(",").filter(Boolean)
      : [];
    const sizeParam = searchParams.get("size")
      ? searchParams.get("size")!.split(",").filter(Boolean)
      : [];
    const inStockParam = searchParams.get("inStock") === "true";
    const sortParam = searchParams.get("sort") || "newest";
    const pageParam = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const perPageParam = Math.max(1, parseInt(searchParams.get("perPage") || "12", 10) || 12);

    setSearchTerm(qParam);
    setSelectedFabrics(fabricParam);
    setSelectedSizes(sizeParam);
    setInStockOnly(inStockParam);
    setSortBy(sortParam);
    setCurrentPage(pageParam);
    setItemsPerPage(perPageParam);
  }, [searchParams]);

  // Update URL search parameters without triggering a scroll jump
  const updateUrlParams = useCallback(
    (updates: {
      q?: string;
      fabric?: string[];
      size?: string[];
      inStock?: boolean;
      sort?: string;
      page?: number;
      perPage?: number;
    }) => {
      const params = new URLSearchParams();

      const nextSearch = updates.q !== undefined ? updates.q : searchTerm;
      const nextFabrics = updates.fabric !== undefined ? updates.fabric : selectedFabrics;
      const nextSizes = updates.size !== undefined ? updates.size : selectedSizes;
      const nextInStock = updates.inStock !== undefined ? updates.inStock : inStockOnly;
      const nextSort = updates.sort !== undefined ? updates.sort : sortBy;
      const nextPage = updates.page !== undefined ? updates.page : currentPage;
      const nextPerPage = updates.perPage !== undefined ? updates.perPage : itemsPerPage;

      if (nextSearch.trim()) params.set("q", nextSearch.trim());
      if (nextFabrics.length > 0) params.set("fabric", nextFabrics.join(","));
      if (nextSizes.length > 0) params.set("size", nextSizes.join(","));
      if (nextInStock) params.set("inStock", "true");
      if (nextSort && nextSort !== "newest") params.set("sort", nextSort);
      if (nextPage > 1) params.set("page", String(nextPage));
      if (nextPerPage !== 12) params.set("perPage", String(nextPerPage));

      const queryStr = params.toString();
      const targetUrl = queryStr ? `${pathname}?${queryStr}` : pathname;
      router.replace(targetUrl, { scroll: false });
    },
    [pathname, router, searchTerm, selectedFabrics, selectedSizes, inStockOnly, sortBy, currentPage, itemsPerPage]
  );

  // Available fabric filters from products
  const fabrics = useMemo(() => {
    const list = new Set<string>();
    initialProducts.forEach((p) => {
      if (p.fabric) {
        const normalized = normalizeFabricName(p.fabric);
        if (normalized) list.add(normalized);
      }
    });
    return Array.from(list).sort();
  }, [initialProducts]);

  const sizes = ["XS", "S", "M", "L", "XL"];

  const toggleFabric = (fabric: string) => {
    const next = selectedFabrics.includes(fabric)
      ? selectedFabrics.filter((f) => f !== fabric)
      : [...selectedFabrics, fabric];
    setSelectedFabrics(next);
    setCurrentPage(1);
    updateUrlParams({ fabric: next, page: 1 });
  };

  const toggleSize = (size: string) => {
    const next = selectedSizes.includes(size)
      ? selectedSizes.filter((s) => s !== size)
      : [...selectedSizes, size];
    setSelectedSizes(next);
    setCurrentPage(1);
    updateUrlParams({ size: next, page: 1 });
  };

  const handleInStockChange = (val: boolean) => {
    setInStockOnly(val);
    setCurrentPage(1);
    updateUrlParams({ inStock: val, page: 1 });
  };

  const handleSortChange = (val: string) => {
    setSortBy(val);
    setCurrentPage(1);
    updateUrlParams({ sort: val, page: 1 });
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
    updateUrlParams({ q: val, page: 1 });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedFabrics([]);
    setSelectedSizes([]);
    setInStockOnly(false);
    setCurrentPage(1);
    updateUrlParams({
      q: "",
      fabric: [],
      size: [],
      inStock: false,
      page: 1,
    });
  };

  // Cached Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    const cleanSearch = searchTerm.trim().toLowerCase();
    const cacheKey = JSON.stringify({
      slug: categorySlug,
      search: cleanSearch,
      fabrics: selectedFabrics,
      sizes: selectedSizes,
      inStock: inStockOnly,
      sort: sortBy,
      baseLength: initialProducts.length,
    });

    if (collectionSearchCache.has(cacheKey)) {
      return collectionSearchCache.get(cacheKey)!;
    }

    let result = [...initialProducts];

    // Filter by cached search keyword (name, description, sku, fabric, color)
    if (cleanSearch) {
      result = result.filter((p) => {
        const nameMatch = p.name?.toLowerCase().includes(cleanSearch);
        const skuMatch = p.sku?.toLowerCase().includes(cleanSearch);
        const descMatch = p.description?.toLowerCase().includes(cleanSearch);
        const fabricMatch = p.fabric?.toLowerCase().includes(cleanSearch);
        const colorMatch = p.color?.toLowerCase().includes(cleanSearch);
        return nameMatch || skuMatch || descMatch || fabricMatch || colorMatch;
      });
    }

    // Filter by Availability (In Stock Only)
    if (inStockOnly) {
      result = result.filter(
        (p) =>
          p.variants &&
          p.variants.some((v) => v.stock_quantity > 0 && v.is_available)
      );
    }

    // Filter by Fabric
    if (selectedFabrics.length > 0) {
      result = result.filter(
        (p) => p.fabric && selectedFabrics.includes(normalizeFabricName(p.fabric))
      );
    }

    // Filter by Size
    if (selectedSizes.length > 0) {
      result = result.filter(
        (p) =>
          p.variants &&
          p.variants.some(
            (v) =>
              selectedSizes.includes(v.size) &&
              (!inStockOnly || (v.stock_quantity > 0 && v.is_available))
          )
      );
    }

    // Sort by selection
    if (sortBy === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === "best-sellers") {
      result.sort((a, b) => {
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }

    // Store in cache (limit cache size to 100 entries)
    if (collectionSearchCache.size > 100) {
      const firstKey = collectionSearchCache.keys().next().value;
      if (firstKey) collectionSearchCache.delete(firstKey);
    }
    collectionSearchCache.set(cacheKey, result);

    return result;
  }, [categorySlug, initialProducts, searchTerm, selectedFabrics, selectedSizes, inStockOnly, sortBy]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredProducts.length);
  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, startIndex, endIndex]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    updateUrlParams({ page: newPage });
    if (gridSectionRef.current) {
      gridSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handlePerPageChange = (newPerPage: number) => {
    setItemsPerPage(newPerPage);
    setCurrentPage(1);
    updateUrlParams({ perPage: newPerPage, page: 1 });
  };

  useEffect(() => {
    trackEcommerceEvent("view_item_list", {
      item_list_name: categoryName,
      item_category: categoryName,
      items: displayedProducts.map((product, index) =>
        productToAnalyticsItem(product, { listName: categoryName, index })
      ),
    });
  }, [categoryName, displayedProducts]);

  // Generate page numbers with ellipsis
  const paginationRange = useMemo(() => {
    const delta = 2;
    const range: (number | string)[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      } else if (range[range.length - 1] !== "...") {
        range.push("...");
      }
    }
    return range;
  }, [currentPage, totalPages]);

  const isFiltered = Boolean(
    searchTerm || selectedFabrics.length > 0 || selectedSizes.length > 0 || inStockOnly
  );

  return (
    <div className={styles.container}>
      <Breadcrumb
        items={[
          { label: "Collections", url: "/collections" },
          { label: categoryName, url: `/collections/${categorySlug}` },
        ]}
      />

      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <h1 className={styles.title}>{categoryName}</h1>
          <span className={styles.productCountBadge}>
            {filteredProducts.length} {filteredProducts.length === 1 ? "Product" : "Products"}
          </span>
        </div>

        <div className={styles.toolbar}>
          {/* Instant Cached Search Bar */}
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </span>
            <input
              type="text"
              placeholder={`Search in ${categoryName}...`}
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className={styles.searchInput}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className={styles.searchClear}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <ListingLayoutSelector value={layout} onChange={setLayout} />
        </div>
      </div>

      {/* Combined Filter & Sort Bar */}
      <div className={styles.filterAndSortContainer}>
        {/* Mobile Toggle Button */}
        <div className={styles.mobileBar}>
          <button
            type="button"
            className={styles.mobileToggleBtn}
            onClick={() => setIsMobileFiltersExpanded(!isMobileFiltersExpanded)}
          >
            <span className={styles.mobileToggleIcon}>🎛</span>
            <span>{isMobileFiltersExpanded ? "Hide Filters & Sort" : "Filters & Sort"}</span>
            {(selectedFabrics.length > 0 || selectedSizes.length > 0 || inStockOnly || searchTerm) && (
              <span className={styles.filterBadge}>
                {selectedFabrics.length + selectedSizes.length + (inStockOnly ? 1 : 0) + (searchTerm ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* The Collapsible Content Container */}
        <div className={`${styles.filterContent} ${isMobileFiltersExpanded ? styles.expanded : ""}`}>
          <div className={styles.filtersWrapper}>
            {/* Availability Filter */}
            <div className={styles.filterGroupInline}>
              <span className={styles.filterGroupLabel}>Availability:</span>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => handleInStockChange(e.target.checked)}
                  className={styles.checkbox}
                />
                <span className="leading-none">In Stock Only</span>
              </label>
            </div>

            {/* Fabric Filter */}
            {fabrics.length > 0 && (
              <div className={styles.filterGroupInline}>
                <span className={styles.filterGroupLabel}>Fabric:</span>
                <div className={styles.inlineOptions}>
                  {fabrics.map((fabric) => {
                    const isChecked = selectedFabrics.includes(fabric);
                    return (
                      <label key={fabric} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleFabric(fabric)}
                          className={styles.checkbox}
                        />
                        <span className="leading-none">{fabric}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Filter */}
            <div className={styles.filterGroupInline}>
              <span className={styles.filterGroupLabel}>Size:</span>
              <div className={styles.sizeListInline}>
                {sizes.map((size) => {
                  const isActive = selectedSizes.includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      className={`${styles.sizeBtnInline} ${isActive ? styles.sizeBtnInlineActive : ""}`}
                      onClick={() => toggleSize(size)}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Clear Filters Button */}
            {isFiltered && (
              <button
                onClick={clearFilters}
                className={styles.clearBtnInline}
                type="button"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Sort By Container */}
          <div className={styles.sortContainerInline}>
            <label htmlFor="sort-select" className={styles.sortLabelInline}>Sort by:</label>
            <select
              id="sort-select"
              className={styles.sortSelectInline}
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              <option value="best-sellers">Best Sellers</option>
              <option value="newest">Newest Arrivals</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.mainLayout} ref={gridSectionRef}>
        {/* Product Grid / Empty State */}
        <div className={styles.contentArea}>
          {displayedProducts.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No products match your selected search or filter criteria.</p>
              <button onClick={clearFilters} className={styles.resetBtn}>
                Reset All Filters &amp; Search
              </button>
            </div>
          ) : (
            <>
              <div
                className={`${styles.grid} ${
                  layout === "editorial-grid"
                    ? styles.gridEditorial
                    : styles.gridFeatured
                }`}
              >
                {displayedProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    listName={categoryName}
                    index={startIndex + index}
                    layout={layout}
                    priority={index < 4}
                  />
                ))}
              </div>

              {/* Enhanced Pagination Controls */}
              {totalPages > 1 && (
                <div className={styles.paginationWrapper}>
                  <div className={styles.paginationSummary}>
                    Showing <strong>{startIndex + 1}–{endIndex}</strong> of <strong>{filteredProducts.length}</strong> products
                  </div>

                  <div className={styles.paginationNav}>
                    <button
                      type="button"
                      className={styles.pageBtn}
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      aria-label="Previous page"
                    >
                      ‹ Prev
                    </button>

                    {paginationRange.map((item, idx) => {
                      if (item === "...") {
                        return <span key={`ellipsis-${idx}`} className={styles.pageEllipsis}>…</span>;
                      }

                      const pageNum = Number(item);
                      const isActive = pageNum === currentPage;
                      return (
                        <button
                          key={`page-${pageNum}`}
                          type="button"
                          className={`${styles.pageBtn} ${isActive ? styles.pageBtnActive : ""}`}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      className={styles.pageBtn}
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      aria-label="Next page"
                    >
                      Next ›
                    </button>
                  </div>

                  <div className={styles.perPageContainer}>
                    <label htmlFor="per-page" className={styles.paginationSummary}>Per page:</label>
                    <select
                      id="per-page"
                      value={itemsPerPage}
                      onChange={(e) => handlePerPageChange(Number(e.target.value))}
                      className={styles.perPageSelect}
                    >
                      <option value={12}>12</option>
                      <option value={24}>24</option>
                      <option value={48}>48</option>
                    </select>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
