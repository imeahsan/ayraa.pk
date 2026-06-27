"use client";

import { useReportWebVitals } from "next/web-vitals";
import { trackWebVital } from "@/lib/analytics";

type ReportWebVitalsCallback = Parameters<typeof useReportWebVitals>[0];

const handleWebVitals: ReportWebVitalsCallback = (metric) => {
  trackWebVital(metric);
};

export function WebVitals() {
  useReportWebVitals(handleWebVitals);
  return null;
}
