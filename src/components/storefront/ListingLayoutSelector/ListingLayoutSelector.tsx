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
  { value: "compact-grid", label: "Compact Grid", shortLabel: "Grid" },
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
              className={`${styles.option} ${isActive ? styles.optionActive : ""}`}
              onClick={() => onChange(option.value)}
              aria-pressed={isActive}
              title={option.label}
            >
              <span className={styles.optionIcon} aria-hidden="true">
                {option.value === "compact-grid" ? "▦" : option.value === "editorial-grid" ? "▥" : "◫"}
              </span>
              <span className={styles.optionText}>{option.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
