const BYPASS_COOKIE_NAME = "ayraa_access_bypass";
const BYPASS_COOKIE_VALUE = "allow";

function getBypassSecret() {
  return process.env.APP_ACCESS_BYPASS_KEY || "";
}

async function signValue(value: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return toBase64Url(signature);
}

function toBase64Url(value: ArrayBuffer) {
  const bytes = new Uint8Array(value);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function getBypassCookieName() {
  return BYPASS_COOKIE_NAME;
}

export async function createBypassCookieValue() {
  const secret = getBypassSecret();
  if (!secret) return "";

  const signature = await signValue(BYPASS_COOKIE_VALUE, secret);
  return `${BYPASS_COOKIE_VALUE}.${signature}`;
}

export async function hasValidBypassCookie(cookieValue: string | undefined) {
  const secret = getBypassSecret();
  if (!secret || !cookieValue) return false;

  const [value, signature] = cookieValue.split(".");
  if (value !== BYPASS_COOKIE_VALUE || !signature) return false;

  const expectedSignature = await signValue(value, secret);
  return signature === expectedSignature;
}

export function isValidBypassKey(candidate: string | null) {
  const secret = getBypassSecret();
  return Boolean(secret) && candidate === secret;
}
