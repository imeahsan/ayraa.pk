import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types";
import styles from "./ProductCard.module.css";

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const primaryImage =
    product.images?.find((img) => img.is_primary) || product.images?.[0];
  const secondaryImage = product.images?.[1] || primaryImage;

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
    <div className={styles.card} id={`product-card-${product.id}`}>
      <Link href={`/product/${product.slug}`} className={styles.imageWrapper}>
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

      <div className={styles.details}>
        {product.category?.name ? (
          <span className={styles.category}>{product.category.name}</span>
        ) : null}
        <h3 className={styles.title}>
          <Link href={`/product/${product.slug}`} className={styles.titleLink}>
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
