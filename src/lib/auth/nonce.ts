/**
 * Generates a cryptographic nonce pair for OpenID Connect (OIDC) authentication.
 * Google Identity Services receives the SHA-256 hashed nonce,
 * while Supabase Auth expects the raw nonce to verify against the ID token claim.
 */
export async function generateNonce(): Promise<{ nonce: string; hashedNonce: string }> {
  const randomValues = new Uint8Array(32);
  window.crypto.getRandomValues(randomValues);
  const nonce = btoa(String.fromCharCode(...randomValues));

  const encoder = new TextEncoder();
  const encodedNonce = encoder.encode(nonce);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", encodedNonce);

  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  return { nonce, hashedNonce };
}
