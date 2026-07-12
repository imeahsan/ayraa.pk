"use client";

import React from "react";
import { ListingLayout } from "@/lib/listing-layout";
import styles from "./ListingLayoutSelector.module.css";

interface ListingLayoutSelectorProps {
  value: ListingLayout;
  onChange: (layout: ListingLayout) => void;
  className?: string;
}

const LAYOUT_OPTIONS: Array<{
  value: ListingLayout;
  label: string;
  shortLabel: string;
}> = [
  { value: "editorial-grid", label: "Editorial Grid", shortLabel: "Editorial" },
  { value: "featured-grid", label: "Large Preview", shortLabel: "Large" },
];

export const ListingLayoutSelector: React.FC<ListingLayoutSelectorProps> = ({
  value,
  onChange,
  className,
}) => {
  return (
    <div className={[styles.selector, className].filter(Boolean).join(" ")}>
      <span className={styles.label}>Layout</span>
      <div className={styles.options} role="group" aria-label="Product listing layout">
        {LAYOUT_OPTIONS.map((option) => {
          const isActive = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              className={`${styles.option} ${isActive ? styles.optionActive : ""} ${option.value === "featured-grid" ? styles.optionLarge : ""}`}
              onClick={() => onChange(option.value)}
              aria-pressed={isActive}
              aria-label={option.label}
              title={option.label}
            >
              <span className={styles.optionIcon} aria-hidden="true">
                {option.value === "editorial-grid" ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="1.5" y="1.5" width="3.5" height="13" />
                    <rect x="6.25" y="1.5" width="3.5" height="13" />
                    <rect x="11" y="1.5" width="3.5" height="13" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="1.5" y="1.5" width="6" height="13" />
                    <rect x="8.5" y="1.5" width="6" height="13" />
                  </svg>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
