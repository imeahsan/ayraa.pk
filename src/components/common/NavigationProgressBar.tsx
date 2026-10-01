"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export const emitNavigationStart = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("ayra:navigation-start"));
  }
};

export const emitNavigationFinish = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("ayra:navigation-finish"));
  }
};

export const NavigationProgressBar: React.FC = () => {
  const [progress, setProgress] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const finishTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startProgress = useCallback(() => {
    if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    setIsVisible(true);
    setProgress(20);

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev === null) return 25;
        if (prev >= 85) return prev;
        const inc = Math.max(1, (90 - prev) * 0.15);
        return Math.min(85, prev + inc);
      });
    }, 200);
  }, []);

  const finishProgress = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    setProgress(100);
    finishTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      setProgress(null);
    }, 300);
  }, []);

  // When pathname or searchParams change, finish progress
  useEffect(() => {
    finishProgress();
  }, [pathname, searchParams, finishProgress]);

  // Listen to custom navigation events and link clicks
  useEffect(() => {
    const handleStart = () => startProgress();
    const handleFinish = () => finishProgress();

    window.addEventListener("ayra:navigation-start", handleStart);
    window.addEventListener("ayra:navigation-finish", handleFinish);

    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:") ||
        target.getAttribute("target") === "_blank" ||
        target.hasAttribute("download") ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      // Check if it's the exact same pathname + hash
      const currentUrl = window.location.pathname + window.location.search;
      if (href === currentUrl) return;

      // Internal URL
      if (href.startsWith("/") || href.startsWith(window.location.origin)) {
        startProgress();
      }
    };

    document.addEventListener("click", handleAnchorClick, { capture: true });

    return () => {
      window.removeEventListener("ayra:navigation-start", handleStart);
      window.removeEventListener("ayra:navigation-finish", handleFinish);
      document.removeEventListener("click", handleAnchorClick, { capture: true });
      if (timerRef.current) clearInterval(timerRef.current);
      if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
    };
  }, [startProgress, finishProgress]);

  if (!isVisible && progress === null) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "2.5px",
        zIndex: 999999,
        pointerEvents: "none",
        backgroundColor: "transparent",
      }}
      aria-hidden="true"
    >
      <div
        style={{
          height: "100%",
          width: `${progress || 0}%`,
          background: "linear-gradient(90deg, #d4af37 0%, #e9c349 50%, #ffe088 100%)",
          boxShadow: "0 0 10px rgba(233, 195, 73, 0.7), 0 0 4px rgba(233, 195, 73, 0.9)",
          transition: "width 240ms cubic-bezier(0.1, 0.05, 0, 1), opacity 200ms ease-out",
          opacity: isVisible ? 1 : 0,
        }}
      />
    </div>
  );
};
