"use client";

import React, { useState } from "react";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/storefront/Button/Button";
import { SizeSelector } from "@/components/storefront/SizeSelector/SizeSelector";
import { ImageGallery } from "@/components/storefront/ImageGallery/ImageGallery";
import { Breadcrumb } from "@/components/storefront/Breadcrumb/Breadcrumb";
import { ProductCard } from "@/components/storefront/ProductCard/ProductCard";
import styles from "./ProductDetailClient.module.css";

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
}

export const ProductDetailClient: React.FC<ProductDetailClientProps> = ({
  product,
  relatedProducts,
}) => {
  const { addItem } = useCart();
  const toast = useToast();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  // Accordion state
  const [activeTab, setActiveTab] = useState<string | null>("fabric");

  const variants = product.variants || [];

  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
  };

  const handleAddToCart = () => {
    if (variants.length > 0 && !selectedSize) {
      toast.warning("Please select a size first.");
      return;
    }

    setIsAdding(true);
    
    // Find selected variant
    const selectedVariant = variants.find((v) => v.size === selectedSize) || null;
    
    // Add to cart with delay to show premium feel loading state
    setTimeout(() => {
      addItem(product, selectedVariant, 1);
      setIsAdding(false);
      toast.success(`${product.name} added to your bag!`);
    }, 600);
  };

  const formattedPrice = Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(product.price);

  const formattedComparePrice = product.compare_at_price
    ? Intl.NumberFormat("en-PK", {
        style: "currency",
        currency: "PKR",
        maximumFractionDigits: 0,
      }).format(product.compare_at_price)
    : null;

  return (
    <div className={styles.container}>
      <Breadcrumb
        items={[
          { label: "Clothing", url: "/collections/ready-to-wear" },
          { label: product.name, url: `/product/${product.slug}` },
        ]}
      />

      <div className={styles.layout}>
        {/* Left Side: Images */}
        <div className={styles.leftSide}>
          {product.images && <ImageGallery images={product.images} />}
        </div>

        {/* Right Side: Details */}
        <div className={styles.rightSide}>
          <div className={styles.header}>
            <h1 className={styles.title}>{product.name}</h1>
            <div className={styles.priceRow}>
              <span className={styles.price}>{formattedPrice}</span>
              {formattedComparePrice && (
                <span className={styles.comparePrice}>{formattedComparePrice}</span>
              )}
            </div>
          </div>

          <p className={styles.description}>{product.description}</p>

          {/* Product attributes */}
          <div className={styles.attributes}>
            {product.fabric && (
              <div className={styles.attrRow}>
                <span className={styles.attrLabel}>Fabric:</span>
                <span className={styles.attrVal}>{product.fabric}</span>
              </div>
            )}
            {product.color && (
              <div className={styles.attrRow}>
                <span className={styles.attrLabel}>Color:</span>
                <span className={styles.attrVal}>{product.color}</span>
              </div>
            )}
            {product.includes && (
              <div className={styles.attrRow}>
                <span className={styles.attrLabel}>Includes:</span>
                <span className={styles.attrVal}>{product.includes}</span>
              </div>
            )}
          </div>

          {/* Size selection */}
          {variants.length > 0 && (
            <div className="mt-2">
              <SizeSelector
                variants={variants}
                selectedSize={selectedSize}
                onChange={handleSizeChange}
              />
            </div>
          )}

          {/* Purchase Actions */}
          <div className="mt-4">
            <Button
              variant="luxury"
              size="lg"
              fullWidth
              onClick={handleAddToCart}
              isLoading={isAdding}
            >
              Add to Bag
            </Button>
          </div>

          {/* Accordion Tabs */}
          <div className={styles.accordion}>
            <div className={styles.accordionItem}>
              <button
                type="button"
                className={styles.accordionTrigger}
                onClick={() => setActiveTab(activeTab === "fabric" ? null : "fabric")}
              >
                <span>Fabric &amp; Craftsmanship</span>
                <span>{activeTab === "fabric" ? "−" : "+"}</span>
              </button>
              {activeTab === "fabric" && (
                <div className={styles.accordionContent}>
                  <p>
                    Crafted from {product.fabric || "premium fabric"} showcasing exquisite
                    hand-embellished beadwork, precise alignments, and luxury linings tailored
                    specifically for the modern muse.
                  </p>
                </div>
              )}
            </div>

            <div className={styles.accordionItem}>
              <button
                type="button"
                className={styles.accordionTrigger}
                onClick={() => setActiveTab(activeTab === "care" ? null : "care")}
              >
                <span>Care Instructions</span>
                <span>{activeTab === "care" ? "−" : "+"}</span>
              </button>
              {activeTab === "care" && (
                <div className={styles.accordionContent}>
                  <p>
                    {product.care_instructions ||
                      "Dry clean only. Do not iron directly on embellishments. Store in a garment cover bag to prevent metallic tarnishing."}
                  </p>
                </div>
              )}
            </div>

            <div className={styles.accordionItem}>
              <button
                type="button"
                className={styles.accordionTrigger}
                onClick={() => setActiveTab(activeTab === "delivery" ? null : "delivery")}
              >
                <span>Delivery &amp; Returns</span>
                <span>{activeTab === "delivery" ? "−" : "+"}</span>
              </button>
              {activeTab === "delivery" && (
                <div className={styles.accordionContent}>
                  <p>
                    Cash on Delivery (COD) only. Flat shipping rate of PKR 250 (Free shipping on orders above PKR 5,000). Delivered within 3-5 working days. Returns accepted within 7 days.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {relatedProducts.length > 0 && (
        <section className={styles.recommendations}>
          <h2 className={styles.recommendationsHeading}>Complete the Look</h2>
          <div className={styles.recommendationsGrid}>
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
