import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types";
import { useWishlist } from "@/context/WishlistContext";
import { getProductSaleState, productToAnalyticsItem, trackEcommerceEvent } from "@/lib/analytics";
import styles from "./ProductCard.module.css";

interface ProductCardProps {
  product: Product;
  listName?: string;
  index?: number;
  onProductClick?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, listName, index, onProductClick }) => {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const primaryImage =
    product.images?.find((img) => img.is_primary) || product.images?.[0];
  const secondaryImage = product.images?.[1] || primaryImage;
  const wishlisted = isWishlisted(product.id);

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

  const handleProductClick = () => {
    trackEcommerceEvent("select_item", {
      item_list_name: listName,
      value: product.price,
      items: [productToAnalyticsItem(product, { listName, index })],
      item_slug: product.slug,
      is_on_sale: getProductSaleState(product),
    });
    onProductClick?.();
  };

  return (
    <div className={styles.card} id={`product-card-${product.id}`}>
      <div className={styles.media}>
        <Link href={`/product/${product.slug}`} className={styles.imageWrapper} onClick={handleProductClick}>
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt_text || product.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={styles.image}
              priority={false}
            />
          ) : (
            <div className="w-full h-full bg-surface-container-high" />
          )}

          {secondaryImage && secondaryImage !== primaryImage ? (
            <Image
              src={secondaryImage.url}
              alt={secondaryImage.alt_text || product.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={styles.secondaryImage}
            />
          ) : null}

          {product.compare_at_price && product.compare_at_price > product.price ? (
            <span className={styles.badge} id={`sale-badge-${product.id}`}>
              Sale
            </span>
          ) : null}
        </Link>

        <button
          type="button"
          className={`${styles.wishlistButton} ${wishlisted ? styles.wishlistButtonActive : ""}`}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          onClick={async (event) => {
            event.preventDefault();
            event.stopPropagation();
            await toggleWishlist(product);
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 22l7.78-8.55 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />
          </svg>
        </button>
      </div>

      <div className={styles.details}>
        {product.category?.name ? (
          <span className={styles.category}>{product.category.name}</span>
        ) : null}
        <h3 className={styles.title}>
          <Link href={`/product/${product.slug}`} className={styles.titleLink} onClick={handleProductClick}>
            {product.name}
          </Link>
        </h3>
        <div className={styles.priceContainer}>
          <span className={styles.price}>{formattedPrice}</span>
          {formattedComparePrice ? (
            <span className={styles.comparePrice}>{formattedComparePrice}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
};
