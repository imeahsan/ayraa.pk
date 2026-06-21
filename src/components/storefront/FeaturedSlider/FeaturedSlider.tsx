"use client";

import React, { useState, useEffect, useRef } from "react";
import { ProductCard } from "../ProductCard/ProductCard";
import { Product } from "@/types";
import styles from "./FeaturedSlider.module.css";

interface FeaturedSliderProps {
  products: Product[];
  autoPlay?: boolean;
  title?: string;
}

export const FeaturedSlider: React.FC<FeaturedSliderProps> = ({
  products,
  autoPlay = true,
  title,
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const itemsPerPage = useRef(4);

  if (!products || products.length === 0) return null;

  // Calculate items per page based on window width
  const getItemsPerPage = () => {
    if (typeof window === "undefined") return 4;
    if (window.innerWidth < 768) return 2;
    if (window.innerWidth < 1024) return 3;
    return 4;
  };

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    itemsPerPage.current = getItemsPerPage();
    const handleResize = () => {
      itemsPerPage.current = getItemsPerPage();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const maxIndex = Math.max(0, products.length - itemsPerPage.current);

  const scrollTo = (index: number) => {
    if (!sliderRef.current) return;
    const track = sliderRef.current;
    const item = track.querySelector(`.${styles.slideItem}`) as HTMLElement;
    if (!item) return;
    const gap = 32;
    const itemWidth = item.offsetWidth + gap;
    track.scrollTo({ left: itemWidth * index, behavior: "smooth" });
    setActiveIndex(index);
  };

  const scrollLeft = () => {
    const next = Math.max(0, activeIndex - 1);
    scrollTo(next);
  };

  const scrollRight = () => {
    const next = Math.min(maxIndex, activeIndex + 1);
    scrollTo(next);
  };

  // Auto-play
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!autoPlay || isPaused) return;
    const timer = setInterval(() => {
      const next = activeIndex >= maxIndex ? 0 : activeIndex + 1;
      scrollTo(next);
    }, 4200);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, isPaused, activeIndex, maxIndex]);

  const totalDots = maxIndex + 1;

  return (
    <div
      className={styles.sliderWrapper}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {title && <p className={styles.sliderLabel}>{title}</p>}

      {/* Scrollable Track */}
      <div ref={sliderRef} className={styles.sliderTrack}>
        {products.map((product) => (
          <div key={product.id} className={styles.slideItem}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {products.length > itemsPerPage.current && (
        <>
          <button
            type="button"
            className={`${styles.navBtn} ${styles.prevBtn} ${activeIndex === 0 ? styles.navBtnDisabled : ""}`}
            onClick={scrollLeft}
            aria-label="Previous"
            disabled={activeIndex === 0}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            className={`${styles.navBtn} ${styles.nextBtn} ${activeIndex >= maxIndex ? styles.navBtnDisabled : ""}`}
            onClick={scrollRight}
            aria-label="Next"
            disabled={activeIndex >= maxIndex}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {totalDots > 1 && (
        <div className={styles.dots} role="tablist" aria-label="Slides">
          {Array.from({ length: totalDots }).map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === activeIndex}
              aria-label={`Slide ${i + 1}`}
              className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ""}`}
              onClick={() => scrollTo(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
