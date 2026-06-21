"use client";

import React, { useState, useEffect, useRef } from "react";
import { Product } from "@/types";
import { ProductCard } from "@/components/storefront/ProductCard/ProductCard";
import { createClient } from "@/lib/supabase/client";

interface AllProductsClientProps {
  initialProducts: Product[];
  gridClassName?: string;
}

export const AllProductsClient: React.FC<AllProductsClientProps> = ({
  initialProducts,
  gridClassName,
}) => {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialProducts.length >= 12);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

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
              .select("*, category:categories(*), images:product_images(*)")
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

  return (
    <>
      <div className={gridClassName}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
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
          <style>{`
            @keyframes pulse-loader {
              0%, 100% { opacity: 0.5; transform: scale(0.98); }
              50% { opacity: 1; transform: scale(1.02); }
            }
          `}</style>
          <span style={{ animation: "pulse-loader 1.5s infinite ease-in-out" }}>
            Loading More Products...
          </span>
        </div>
      )}
    </>
  );
};
