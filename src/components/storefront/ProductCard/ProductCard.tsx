import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types";
import { useWishlist } from "@/context/WishlistContext";
import { getProductSaleState, productToAnalyticsItem, trackEcommerceEvent } from "@/lib/analytics";
import { ListingLayout } from "@/lib/listing-layout";
import styles from "./ProductCard.module.css";

interface ProductCardProps {
  product: Product;
  listName?: string;
  index?: number;
  onProductClick?: () => void;
  layout?: ListingLayout;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  listName,
  index,
  onProductClick,
  layout = "compact-grid",
}) => {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const primaryImage =
    product.images?.find((img) => img.is_primary) || product.images?.[0];
  const alternateImage =
    product.images?.find((img) => img.url !== primaryImage?.url) || null;
  const [primaryLoaded, setPrimaryLoaded] = React.useState(false);
  const [primaryFailed, setPrimaryFailed] = React.useState(false);
  const [secondaryLoaded, setSecondaryLoaded] = React.useState(false);
  const wishlisted = isWishlisted(product.id);
  const isOutOfStock = product.variants !== undefined && (product.variants.length === 0 || product.variants.every((v) => v.stock_quantity <= 0));
  const displayImage = primaryFailed && alternateImage ? alternateImage : primaryImage;
  const hoverImage =
    alternateImage && alternateImage.url !== displayImage?.url ? alternateImage : null;
  const shouldPrioritize = index !== undefined && index < 4;
  const imageSizes =
    layout === "featured-grid"
      ? "(max-width: 767px) 50vw, (max-width: 1023px) 50vw, 50vw"
      : layout === "editorial-grid"
        ? "(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
        : "(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw";

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

  const cardClassName = [
    styles.card,
    layout === "compact-grid"
      ? styles.cardCompactGrid
      : layout === "editorial-grid"
        ? styles.cardEditorialGrid
        : styles.cardFeaturedGrid,
  ].join(" ");

  const imageWrapperClassName = [
    styles.imageWrapper,
    layout === "editorial-grid" ? styles.imageWrapperEditorialGrid : "",
    layout === "featured-grid" ? styles.imageWrapperFeaturedGrid : "",
    !primaryLoaded ? styles.imageWrapperLoading : "",
  ].filter(Boolean).join(" ");

  const detailsClassName = [
    styles.details,
    layout === "editorial-grid" ? styles.detailsEditorialGrid : "",
    layout === "featured-grid" ? styles.detailsFeaturedGrid : "",
  ].filter(Boolean).join(" ");

  const titleClassName = [
    styles.title,
    layout === "editorial-grid" ? styles.titleEditorialGrid : "",
    layout === "featured-grid" ? styles.titleFeaturedGrid : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={cardClassName} id={`product-card-${product.id}`}>
      <div className={styles.media}>
        <Link href={`/product/${product.slug}`} className={imageWrapperClassName} onClick={handleProductClick}>
          {displayImage ? (
            <Image
              src={displayImage.url}
              alt={displayImage.alt_text || product.name}
              fill
              sizes={imageSizes}
              className={`${styles.image} ${primaryLoaded ? styles.imageLoaded : ""}`}
              fetchPriority={shouldPrioritize ? "high" : "auto"}
              loading={shouldPrioritize ? "eager" : "lazy"}
              onLoad={() => setPrimaryLoaded(true)}
              onError={() => setPrimaryFailed(true)}
            />
          ) : (
            <div className="w-full h-full bg-surface-container-high" />
          )}

          {hoverImage ? (
            <Image
              src={hoverImage.url}
              alt={hoverImage.alt_text || product.name}
              fill
              sizes={imageSizes}
              className={`${styles.secondaryImage} ${secondaryLoaded ? styles.secondaryImageLoaded : ""}`}
              loading="lazy"
              onLoad={() => setSecondaryLoaded(true)}
            />
          ) : null}

          <div className={styles.badgeContainer}>
            {isOutOfStock && (
              <span className={styles.outOfStockBadge} id={`out-of-stock-badge-${product.id}`}>
                Sold out!
              </span>
            )}
            {product.compare_at_price && product.compare_at_price > product.price ? (
              <span className={styles.badge} id={`sale-badge-${product.id}`}>
                Sale
              </span>
            ) : null}
          </div>
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

      <div className={detailsClassName}>
        {product.category?.name ? (
          <span className={styles.category}>{product.category.name}</span>
        ) : null}
        <h3 className={titleClassName}>
          <Link href={`/product/${product.slug}`} className={styles.titleLink} onClick={handleProductClick}>
            {product.name}
          </Link>
        </h3>
        <div className={`${styles.priceContainer} ${layout === "featured-grid" ? styles.priceContainerFeaturedGrid : ""}`}>
          <span className={styles.price}>{formattedPrice}</span>
          {formattedComparePrice ? (
            <span className={styles.comparePrice}>{formattedComparePrice}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
};
