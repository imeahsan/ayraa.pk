"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Product, ProductImage } from "@/types";
import { trackEvent } from "@/lib/analytics";
import styles from "./ImageGallery.module.css";

interface ImageGalleryProps {
  images: ProductImage[];
  product?: Product;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ images, product }) => {
  const [activeImage, setActiveImage] = useState<ProductImage | undefined>(
    images.find((img) => img.is_primary) || images[0]
  );
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (images && images.length > 0) {
      const stillExists = images.some((img) => img.id === activeImage?.id);
      if (!stillExists) {
        setActiveImage(images.find((img) => img.is_primary) || images[0]);
      }
    }
  }, [images, activeImage?.id]);

  const currentImage = activeImage || images.find((img) => img.is_primary) || images[0];

  if (!images || images.length === 0 || !currentImage) {
    return <div className={styles.fallback} />;
  }

  // Hover zoom effect for a luxury feel
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;

    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: "scale(1.8)",
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({});
  };

  const handleThumbnailClick = (img: ProductImage, index: number) => {
    setActiveImage(img);
    trackEvent("product_image_view", {
      item_id: product?.id || img.product_id,
      item_name: product?.name,
      image_id: img.id,
      image_index: index,
    });
  };

  return (
    <div className={styles.gallery}>
      {/* Thumbnails list */}
      <div className={styles.thumbnailsScroll}>
        <div className={styles.thumbnailsList}>
          {images.map((img, index) => {
            const isActive = img.id === currentImage.id;
            return (
              <button
                key={img.id}
                type="button"
                className={`${styles.thumbBtn} ${isActive ? styles.thumbActive : ""}`}
                onClick={() => handleThumbnailClick(img, index)}
                aria-label="View product image thumbnail"
              >
                <div className={styles.thumbImageWrapper}>
                  <Image
                    src={img.url}
                    alt={img.alt_text || "Product image thumbnail"}
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Image Viewer */}
      <div
        className={styles.mainWrapper}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className={styles.zoomContainer} style={zoomStyle}>
          <Image
            src={currentImage.url}
            alt={currentImage.alt_text || "Product image"}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            fetchPriority="high"
            loading="eager"
          />
        </div>
      </div>
    </div>
  );
};
