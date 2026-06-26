"use client";

import React, { useState, useMemo } from "react";
import { Product } from "@/types";
import { ProductCard } from "@/components/storefront/ProductCard/ProductCard";
import { Breadcrumb } from "@/components/storefront/Breadcrumb/Breadcrumb";
import styles from "./CollectionClient.module.css";

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
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [limit, setLimit] = useState<number>(6);

  // Available filters from products
  const fabrics = useMemo(() => {
    const list = new Set<string>();
    initialProducts.forEach((p) => {
      if (p.fabric) list.add(p.fabric);
    });
    return Array.from(list);
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
  };

  // Filter & sort logic
  const filteredProducts = useMemo(() => {
    let result = [...initialProducts];

    // Filter by Fabric
    if (selectedFabrics.length > 0) {
      result = result.filter((p) => p.fabric && selectedFabrics.includes(p.fabric));
    }

    // Filter by Size
    if (selectedSizes.length > 0) {
      result = result.filter(
        (p) =>
          p.variants &&
          p.variants.some((v) => selectedSizes.includes(v.size) && v.stock_quantity > 0)
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
  }, [initialProducts, selectedFabrics, selectedSizes, sortBy]);

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, limit);
  }, [filteredProducts, limit]);

  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

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
        <div className={styles.sortContainer}>
          <span className={styles.sortLabel}>Sort by:</span>
          <select
            className={styles.sortSelect}
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

      <div className={styles.mainLayout}>
        {/* Sidebar Filters */}
        <aside className={styles.sidebar}>
          <div className={styles.filterGroup}>
            <h3 className={styles.filterHeading}>Fabric</h3>
            <div className={styles.checkboxList}>
              {fabrics.length === 0 ? (
                <span className="font-body text-xs text-on-surface-muted italic">No fabric filters available</span>
              ) : (
                fabrics.map((fabric) => {
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
                })
              )}
            </div>
          </div>

          <div className={styles.filterGroup}>
            <h3 className={styles.filterHeading}>Size</h3>
            <div className={styles.sizeList}>
              {sizes.map((size) => {
                const isActive = selectedSizes.includes(size);
                return (
                  <button
                    key={size}
                    type="button"
                    className={`${styles.sizeBtn} ${isActive ? styles.sizeBtnActive : ""}`}
                    onClick={() => toggleSize(size)}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {(selectedFabrics.length > 0 || selectedSizes.length > 0) && (
            <button
              onClick={clearFilters}
              className={styles.clearBtn}
              type="button"
            >
              Clear Filters
            </button>
          )}
        </aside>

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
              <div className={styles.grid}>
                {displayedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
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
