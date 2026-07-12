"use client";

import React, { useState, useMemo } from "react";
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
  const { layout, setLayout } = useListingLayoutPreference();
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [limit, setLimit] = useState<number>(6);
  const [isMobileFiltersExpanded, setIsMobileFiltersExpanded] = useState<boolean>(false);

  // Available filters from products
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
    setSelectedFabrics((prev) =>
      prev.includes(fabric) ? prev.filter((f) => f !== fabric) : [...prev, fabric]
    );
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const clearFilters = () => {
    setSelectedFabrics([]);
    setSelectedSizes([]);
    setInStockOnly(false);
  };

  // Filter & sort logic
  const filteredProducts = useMemo(() => {
    let result = [...initialProducts];

    // Filter by Availability (In Stock Only)
    if (inStockOnly) {
      result = result.filter(
        (p) =>
          p.variants &&
          p.variants.some((v) => v.stock_quantity > 0)
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
          p.variants.some((v) => selectedSizes.includes(v.size) && (!inStockOnly || v.stock_quantity > 0))
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

    return result;
  }, [initialProducts, selectedFabrics, selectedSizes, inStockOnly, sortBy]);

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, limit);
  }, [filteredProducts, limit]);

  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    trackEcommerceEvent("view_item_list", {
      item_list_name: categoryName,
      item_category: categoryName,
      items: displayedProducts.map((product, index) =>
        productToAnalyticsItem(product, { listName: categoryName, index })
      ),
    });
  }, [categoryName, displayedProducts]);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && filteredProducts.length > limit) {
          // Trigger loading more products by incrementing limit
          setLimit((prev) => prev + 6);
        }
      },
      { rootMargin: "200px" } // Load before element hits viewport
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [filteredProducts.length, limit]);

  return (
    <div className={styles.container}>
      <Breadcrumb
        items={[
          { label: "Collections", url: "/collections" },
          { label: categoryName, url: `/collections/${categorySlug}` },
        ]}
      />

      <div className={styles.header}>
        <h1 className={styles.title}>{categoryName}</h1>
        <div className={styles.toolbar}>
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
            {(selectedFabrics.length > 0 || selectedSizes.length > 0 || inStockOnly) && (
              <span className={styles.filterBadge}>
                {selectedFabrics.length + selectedSizes.length + (inStockOnly ? 1 : 0)}
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
                  onChange={(e) => setInStockOnly(e.target.checked)}
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
            {(selectedFabrics.length > 0 || selectedSizes.length > 0 || inStockOnly) && (
              <button
                onClick={clearFilters}
                className={styles.clearBtnInline}
                type="button"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sort By Container (moved here to sit on the same line on desktop) */}
          <div className={styles.sortContainerInline}>
            <label htmlFor="sort-select" className={styles.sortLabelInline}>Sort by:</label>
            <select
              id="sort-select"
              className={styles.sortSelectInline}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="best-sellers">Best Sellers</option>
              <option value="newest">Newest Arrivals</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.mainLayout}>

        {/* Product Grid / Empty State */}
        <div className={styles.contentArea}>
          {displayedProducts.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No products match your selected criteria.</p>
              <button onClick={clearFilters} className={styles.resetBtn}>
                Reset All Filters
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
                    index={index}
                    layout={layout}
                  />
                ))}
              </div>

              {filteredProducts.length > limit && (
                <div
                  ref={sentinelRef}
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    paddingBlock: "48px",
                    color: "var(--color-gold)",
                    fontFamily: "var(--font-body)",
                    fontSize: "13px",
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                  }}
                >
                  <span className="pulse-loader">
                    Loading More...
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
