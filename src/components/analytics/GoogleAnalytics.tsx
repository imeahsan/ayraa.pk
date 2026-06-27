"use client";

import React, { Suspense, useEffect, useRef } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import {
  getAnalyticsConsent,
  getMeasurementId,
  isAdminPath,
  isAnalyticsDebug,
  isAnalyticsEnabled,
  trackPageView,
} from "@/lib/analytics";

function AnalyticsRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedUrl = useRef<string | null>(null);

  useEffect(() => {
    if (!isAnalyticsEnabled || !pathname || isAdminPath(pathname)) return;
    if (getAnalyticsConsent() !== "accepted") return;

    const queryString = searchParams.toString();
    const relativeUrl = `${pathname}${queryString ? `?${queryString}` : ""}`;
    if (lastTrackedUrl.current === relativeUrl) return;

    lastTrackedUrl.current = relativeUrl;
    trackPageView(window.location.href, document.title, pathname);
  }, [pathname, searchParams]);

  return null;
}

export function GoogleAnalytics() {
  const measurementId = getMeasurementId();

  useEffect(() => {
    if (!isAnalyticsEnabled) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag =
      window.gtag ||
      function gtag(...args: unknown[]) {
        window.dataLayer?.push(args);
      };

    window.gtag("consent", "default", {
      analytics_storage: getAnalyticsConsent() === "accepted" ? "granted" : "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      wait_for_update: 500,
    });
    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      send_page_view: false,
      debug_mode: isAnalyticsDebug,
    });
  }, [measurementId]);

  if (!isAnalyticsEnabled || !measurementId) return null;

  return (
    <>
      <Script
        id="ga4-script"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Suspense fallback={null}>
        <AnalyticsRouteTracker />
      </Suspense>
    </>
  );
}
