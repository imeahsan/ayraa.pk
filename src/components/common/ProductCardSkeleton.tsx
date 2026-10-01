"use client";

import React from "react";
import styles from "./ProductCardSkeleton.module.css";

interface ProductCardSkeletonProps {
  count?: number;
}

export const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({ count = 4 }) => {
  return (
    <div className={styles.grid}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={styles.card} aria-hidden="true">
          <div className={styles.mediaSkeleton}>
            <div className={styles.shimmer} />
          </div>
          <div className={styles.content}>
            <div className={styles.categorySkeleton} />
            <div className={styles.titleSkeleton} />
            <div className={styles.priceSkeleton} />
          </div>
        </div>
      ))}
    </div>
  );
};
