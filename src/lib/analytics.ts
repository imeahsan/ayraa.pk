"use client";

import type { Cart, CartItem, Product, ProductVariant } from "@/types";

export type AnalyticsConsent = "accepted" | "rejected" | null;

export type AnalyticsParams = Record<
  string,
  string | number | boolean | null | undefined | AnalyticsItem[] | Record<string, unknown>
>;

export interface AnalyticsItem {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_variant?: string;
  price?: number;
  quantity?: number;
  discount?: number;
  coupon?: string;
  index?: number;
  item_list_name?: string;
}

export interface EcommerceEventParams extends AnalyticsParams {
  currency?: "PKR";
  value?: number;
  items: AnalyticsItem[];
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const CONSENT_STORAGE_KEY = "ayra_analytics_consent";
const PURCHASE_SESSION_PREFIX = "ayra_ga_purchase_sent:";
const PURCHASE_LOCAL_PREFIX = "ayra_ga_purchase_sent:";
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const isAnalyticsEnabled =
  process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true" && Boolean(GA_MEASUREMENT_ID);

export const isAnalyticsDebug = process.env.NEXT_PUBLIC_GA_DEBUG === "true";

export const isAdminPath = (pathname?: string | null) => Boolean(pathname?.startsWith("/admin"));

export const getMeasurementId = () => GA_MEASUREMENT_ID;

export function getAnalyticsConsent(): AnalyticsConsent {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  if (stored === "accepted" || stored === "rejected") return stored;
  return null;
}

export function setAnalyticsConsent(consent: Exclude<AnalyticsConsent, null>) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(CONSENT_STORAGE_KEY, consent);
  const granted = consent === "accepted" ? "granted" : "denied";
  window.gtag?.("consent", "update", {
    analytics_storage: granted,
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}

function canTrack(pathname?: string | null) {
  return isAnalyticsEnabled && getAnalyticsConsent() === "accepted" && !isAdminPath(pathname);
}

function cleanParams<T extends AnalyticsParams>(params?: T): AnalyticsParams {
  const clean: AnalyticsParams = {};

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      clean[key] = value as AnalyticsParams[string];
    }
  });

  return clean;
}

function debugLog(eventName: string, params?: AnalyticsParams) {
  if (!isAnalyticsDebug || typeof window === "undefined") return;
  console.info("[analytics]", eventName, params || {});
}

export function trackEvent(
  eventName: string,
  params?: AnalyticsParams,
  options?: { pathname?: string | null; force?: boolean }
) {
  if (!options?.force && !canTrack(options?.pathname)) return;
  if (typeof window === "undefined" || !window.gtag) return;

  const payload = cleanParams(params);
  debugLog(eventName, payload);
  window.gtag("event", eventName, payload);
}

export function trackPageView(url: string, title?: string, pathname?: string | null) {
  if (!canTrack(pathname)) return;
  if (!GA_MEASUREMENT_ID) return;

  trackEvent(
    "page_view",
    {
      page_location: url,
      page_title: title,
      send_to: GA_MEASUREMENT_ID,
    },
    { pathname, force: true }
  );
}

export function trackEcommerceEvent(
  eventName: string,
  params: EcommerceEventParams,
  options?: { pathname?: string | null }
) {
  trackEvent(eventName, { currency: "PKR", ...params }, options);
}

export function trackWebVital(metric: {
  id: string;
  name: string;
  label?: string;
  value: number;
  rating?: string;
}) {
  trackEvent("web_vital", {
    event_category: "Web Vitals",
    event_label: metric.id,
    metric_name: metric.name,
    metric_value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
    metric_rating: metric.rating,
    non_interaction: true,
  });
}

export function getVariantLabel(variant?: ProductVariant | null) {
  if (!variant) return undefined;
  return [variant.size, variant.color].filter((part) => part && part !== "Standard").join(" / ") || undefined;
}

export function getProductSaleState(product: Product) {
  return Boolean(
    product.is_on_sale ||
      (product.compare_at_price && product.compare_at_price > product.price)
  );
}

export function productToAnalyticsItem(
  product: Product,
  options?: {
    variant?: ProductVariant | null;
    quantity?: number;
    index?: number;
    listName?: string;
    coupon?: string | null;
    discount?: number;
  }
): AnalyticsItem {
  return {
    item_id: product.id,
    item_name: product.name,
    item_category: product.category?.name,
    item_variant: getVariantLabel(options?.variant),
    price: product.price,
    quantity: options?.quantity ?? 1,
    discount: options?.discount,
    coupon: options?.coupon || undefined,
    index: options?.index,
    item_list_name: options?.listName,
  };
}

export function cartItemToAnalyticsItem(
  item: CartItem,
  options?: { index?: number; coupon?: string | null; discount?: number }
): AnalyticsItem {
  return productToAnalyticsItem(item.product, {
    variant: item.variant,
    quantity: item.quantity,
    index: options?.index,
    coupon: options?.coupon,
    discount: options?.discount,
  });
}

export function cartToAnalyticsItems(cart: Cart, coupon?: string | null) {
  return cart.items.map((item, index) =>
    cartItemToAnalyticsItem(item, {
      index,
      coupon,
    })
  );
}

export function getCartItemValue(item: CartItem) {
  return item.product.price * item.quantity;
}

export function isPurchaseAlreadyTracked(orderId: string) {
  if (typeof window === "undefined") return true;
  return (
    window.sessionStorage.getItem(`${PURCHASE_SESSION_PREFIX}${orderId}`) === "true" ||
    window.localStorage.getItem(`${PURCHASE_LOCAL_PREFIX}${orderId}`) === "true"
  );
}

export function markPurchaseTracked(orderId: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(`${PURCHASE_SESSION_PREFIX}${orderId}`, "true");
  window.localStorage.setItem(`${PURCHASE_LOCAL_PREFIX}${orderId}`, "true");
}

export function trackSanitizedSupabaseError(source: string, error: unknown) {
  const code =
    typeof error === "object" && error && "code" in error && typeof error.code === "string"
      ? error.code
      : "unknown";

  trackEvent("supabase_client_error", {
    source,
    error_code: code,
  });
}
