"use client";

import React from "react";
import styles from "./LuxuryLoader.module.css";

interface LuxuryLoaderProps {
  label?: string;
  size?: "sm" | "md" | "lg";
  variant?: "inline" | "page" | "fullscreen";
  className?: string;
}

export const LuxuryLoader: React.FC<LuxuryLoaderProps> = ({
  label = "Ayraa",
  size = "md",
  variant = "page",
  className = "",
}) => {
  const containerClass = [
    styles.wrapper,
    styles[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const emblemSizes = {
    sm: { orbit: 42, flower: 28, viewBoxOrbit: "0 0 84 84", viewBoxFlower: "0 0 64 64" },
    md: { orbit: 70, flower: 46, viewBoxOrbit: "0 0 84 84", viewBoxFlower: "0 0 64 64" },
    lg: { orbit: 96, flower: 64, viewBoxOrbit: "0 0 84 84", viewBoxFlower: "0 0 64 64" },
  };

  const dim = emblemSizes[size];

  return (
    <div className={containerClass} role="status" aria-live="polite" aria-label={label || "Loading"}>
      <div className={`${styles.loaderContainer} ${styles[`size-${size}`]}`}>
        <div className={styles.emblem} style={{ width: dim.orbit, height: dim.orbit }}>
          {/* Outer dashed orbit circle */}
          <svg
            className={styles.orbit}
            width={dim.orbit}
            height={dim.orbit}
            viewBox="0 0 84 84"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle
              cx="42"
              cy="42"
              r="39"
              stroke="var(--color-gold)"
              strokeWidth="1.2"
              strokeDasharray="5 5"
              opacity="0.45"
            />
          </svg>

          {/* Central 8-petal luxury flower */}
          <svg
            className={styles.flower}
            width={dim.flower}
            height={dim.flower}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <g>
              <path d="M32 32 C32 20, 29 10, 32 10 C35 10, 32 20, 32 32 Z" fill="var(--color-gold-muted)" stroke="var(--color-gold)" strokeWidth="1.5" />
              <path d="M32 32 C32 20, 29 10, 32 10 C35 10, 32 20, 32 32 Z" fill="var(--color-gold-muted)" stroke="var(--color-gold)" strokeWidth="1.5" transform="rotate(45 32 32)" />
              <path d="M32 32 C32 20, 29 10, 32 10 C35 10, 32 20, 32 32 Z" fill="var(--color-gold-muted)" stroke="var(--color-gold)" strokeWidth="1.5" transform="rotate(90 32 32)" />
              <path d="M32 32 C32 20, 29 10, 32 10 C35 10, 32 20, 32 32 Z" fill="var(--color-gold-muted)" stroke="var(--color-gold)" strokeWidth="1.5" transform="rotate(135 32 32)" />
              <path d="M32 32 C32 20, 29 10, 32 10 C35 10, 32 20, 32 32 Z" fill="var(--color-gold-muted)" stroke="var(--color-gold)" strokeWidth="1.5" transform="rotate(180 32 32)" />
              <path d="M32 32 C32 20, 29 10, 32 10 C35 10, 32 20, 32 32 Z" fill="var(--color-gold-muted)" stroke="var(--color-gold)" strokeWidth="1.5" transform="rotate(225 32 32)" />
              <path d="M32 32 C32 20, 29 10, 32 10 C35 10, 32 20, 32 32 Z" fill="var(--color-gold-muted)" stroke="var(--color-gold)" strokeWidth="1.5" transform="rotate(270 32 32)" />
              <path d="M32 32 C32 20, 29 10, 32 10 C35 10, 32 20, 32 32 Z" fill="var(--color-gold-muted)" stroke="var(--color-gold)" strokeWidth="1.5" transform="rotate(315 32 32)" />
              <circle cx="32" cy="32" r="5.5" fill="var(--color-gold)" stroke="var(--color-bg)" strokeWidth="1" />
            </g>
          </svg>
        </div>

        {label && <span className={styles.label}>{label}</span>}
      </div>
    </div>
  );
};
