"use client";

import React, { useRef } from "react";
import { ProductCard } from "../ProductCard/ProductCard";
import { Product } from "@/types";
import styles from "./FeaturedSlider.module.css";

interface FeaturedSliderProps {
  products: Product[];
}

export const FeaturedSlider: React.FC<FeaturedSliderProps> = ({ products }) => {
  const sliderRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (sliderRef.current) {
      const cardWidth = sliderRef.current.querySelector(`.${styles.slideItem}`)?.clientWidth || 300;
      const gap = 32; // Matches gap in CSS
      sliderRef.current.scrollBy({ left: -(cardWidth + gap), behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      const cardWidth = sliderRef.current.querySelector(`.${styles.slideItem}`)?.clientWidth || 300;
      const gap = 32; // Matches gap in CSS
      sliderRef.current.scrollBy({ left: cardWidth + gap, behavior: "smooth" });
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <div className={styles.sliderWrapper}>
      {/* Scrollable Track */}
      <div ref={sliderRef} className={styles.sliderTrack}>
        {products.map((product) => (
          <div key={product.id} className={styles.slideItem}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {/* Floating Navigation Arrows */}
      {products.length > 1 && (
        <>
          <button
            type="button"
            className={`${styles.navBtn} ${styles.prevBtn}`}
            onClick={scrollLeft}
            aria-label="Previous Featured Products"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            type="button"
            className={`${styles.navBtn} ${styles.nextBtn}`}
            onClick={scrollRight}
            aria-label="Next Featured Products"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </>
      )}
    </div>
  );
};
