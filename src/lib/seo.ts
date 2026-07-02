export const SITE_NAME = "Ayraa Collection";
export const BRAND_NAME = "Ayraa";
export const DEFAULT_SITE_URL = "https://store.ayraa.pk";
export const DEFAULT_OG_IMAGE = "/og-image.jpg";

export const DEFAULT_SEO_TITLE = "Ayraa | Pakistani Lawn, Pret, Festive Wear and Home Textiles";
export const DEFAULT_SEO_DESCRIPTION =
  "Shop Ayraa for Pakistani lawn, pret, festive wear, hijabs, bedding, and home textiles with premium fabrics, COD, and nationwide delivery.";

export function getSiteUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || DEFAULT_SITE_URL;
  return url.replace(/\/+$/, "");
}

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
}

export function normalizeCanonicalPath(path = "/") {
  if (path === "") return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

export function truncateSeoText(value: string | null | undefined, fallback: string, maxLength = 155) {
  const text = (value || fallback).replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

export function productSeoTitle(name: string) {
  return `${name} | Pakistani Fashion`;
}

export function collectionSeoTitle(name: string) {
  return `${name} Collection`;
}
