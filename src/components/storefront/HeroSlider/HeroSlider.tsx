"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./HeroSlider.module.css";

export interface HeroSlide {
  id: string;
  image_url: string;
  badge?: string;
  title: string;
  subtitle?: string;
  button_text?: string;
  button_link?: string;
}

interface HeroSliderProps {
  slides: HeroSlide[];
}

export const HeroSlider: React.FC<HeroSliderProps> = ({ slides }) => {
  const [current, setCurrent] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [slides.length, nextSlide]);

  if (!slides || slides.length === 0) return null;

  const renderTitle = (title: string) => {
    const parts = title.split(/\\n|\n/);
    if (parts.length > 1) {
      return (
        <>
          {parts[0]}
          <br />
          <em className={styles.heroTitleItalic}>{parts.slice(1).join(" ")}</em>
        </>
      );
    }
    return title;
  };

  return (
    <section className={styles.hero} id="hero-section">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`${styles.slide} ${index === current ? styles.active : ""}`}
        >
          <Image
            src={slide.image_url}
            alt={slide.title}
            fill
            priority={index === 0}
            sizes="100vw"
            className={styles.heroImg}
          />
          {/* Gradient overlays */}
          <div className={styles.heroOverlayTop} />
          <div className={styles.heroOverlayBot} />

          <div className={styles.heroContent}>
            {slide.badge && (
              <span className={styles.heroBadge}>{slide.badge}</span>
            )}
            <h1 className={styles.heroTitle}>{renderTitle(slide.title)}</h1>
            {slide.subtitle && (
              <p className={slide.badge ? styles.heroSub : styles.heroSubNoBadge}>{slide.subtitle}</p>
            )}
            
            {(slide.button_text && slide.button_link) && (
              <div className={styles.heroActions}>
                <Link href={slide.button_link} className={styles.heroBtn}>
                  {slide.button_text}
                </Link>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Slider dots */}
      {slides.length > 1 && (
        <div className={styles.dots}>
          {slides.map((_, index) => (
            <button
              key={index}
              className={`${styles.dot} ${index === current ? styles.dotActive : ""}`}
              onClick={() => setCurrent(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Scroll indicator */}
      <div className={styles.scrollIndicator} aria-hidden="true">
        <span className={styles.scrollLine} />
      </div>
    </section>
  );
};
