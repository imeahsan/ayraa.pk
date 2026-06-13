"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ProductImage } from "@/types";
import styles from "./ImageGallery.module.css";

interface ImageGalleryProps {
  images: ProductImage[];
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
  const [activeImage, setActiveImage] = useState<ProductImage>(
    images.find((img) => img.is_primary) || images[0]
  );
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({});

  if (!images || images.length === 0) {
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

  return (
    <div className={styles.gallery}>
      {/* Thumbnails list */}
      <div className={styles.thumbnailsScroll}>
        <div className={styles.thumbnailsList}>
          {images.map((img) => {
            const isActive = img.id === activeImage.id;
            return (
              <button
                key={img.id}
                type="button"
                className={`${styles.thumbBtn} ${isActive ? styles.thumbActive : ""}`}
                onClick={() => setActiveImage(img)}
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
            src={activeImage.url}
            alt={activeImage.alt_text || "Product image"}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        </div>
      </div>
    </div>
  );
};
