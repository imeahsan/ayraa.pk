"use client";

import React, { useState, useEffect, useRef } from "react";
import { Product } from "@/types";
import { ProductCard } from "@/components/storefront/ProductCard/ProductCard";
import { ListingLayoutSelector } from "@/components/storefront/ListingLayoutSelector/ListingLayoutSelector";
import { useListingLayoutPreference } from "@/components/storefront/useListingLayoutPreference";
import { createClient } from "@/lib/supabase/client";
import { productToAnalyticsItem, trackEcommerceEvent } from "@/lib/analytics";
import styles from "./AllProductsClient.module.css";

interface AllProductsClientProps {
  initialProducts: Product[];
}

export const AllProductsClient: React.FC<AllProductsClientProps> = ({
  initialProducts,
}) => {
  const supabase = createClient();
  const { layout, setLayout } = useListingLayoutPreference();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialProducts.length >= 12);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    trackEcommerceEvent("view_item_list", {
      item_list_name: "All products",
      items: products.map((product, index) =>
        productToAnalyticsItem(product, { listName: "All products", index })
      ),
    });
  }, [products]);

  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting) {
          setLoading(true);
          try {
            const nextPage = page + 1;
            const from = nextPage * 12 - 12;
            const to = from + 12 - 1;

            const { data, error } = await supabase
              .from("products")
              .select("*, category:categories(*), images:product_images(*), variants:product_variants(*)")
              .eq("is_active", true)
              .order("created_at", { ascending: false })
              .range(from, to);

            if (error) throw error;

            if (data && data.length > 0) {
              setProducts((prev) => {
                const existingIds = new Set(prev.map((p) => p.id));
                const newProds = data.filter((p) => !existingIds.has(p.id));
                return [...prev, ...newProds];
              });
              setPage(nextPage);
              if (data.length < 12) {
                setHasMore(false);
              }
            } else {
              setHasMore(false);
            }
          } catch (err) {
            console.error("Failed to load more products on scroll:", err);
          } finally {
            setLoading(false);
          }
        }
      },
      { rootMargin: "200px" }
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
  }, [page, hasMore, loading, supabase]);

  const gridClassName = [
    styles.grid,
    layout === "compact-grid"
      ? styles.compactGrid
      : layout === "editorial-grid"
        ? styles.editorialGrid
        : styles.featuredGrid,
  ].join(" ");

  return (
    <>
      <div className={styles.header}>
        <div className={styles.summary}>
          <span className={styles.eyebrow}>Product View</span>
          <span className={styles.count}>{products.length} products loaded</span>
        </div>
        <ListingLayoutSelector value={layout} onChange={setLayout} />
      </div>

      <div className={gridClassName}>
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            listName="All products"
            index={index}
            layout={layout}
          />
        ))}
      </div>

      {hasMore && (
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
            Loading More Products...
          </span>
        </div>
      )}
    </>
  );
};
