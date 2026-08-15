/**
 * Isomorphic Web Crypto helper for RFC 7636 PKCE.
 * Uses globalThis.crypto which is available in Node 18+, Edge, Browsers, Bun, Deno, etc.
 */

function getCrypto(): Crypto {
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.subtle) {
    return globalThis.crypto;
  }
  throw new Error("Web Crypto API (crypto.subtle) is not available in the current environment.");
}

/**
 * Converts a Uint8Array or ArrayBuffer into a URL-safe Base64 string without padding.
 */
export function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  // Use btoa if available in globalThis, or Buffer fallback in Node
  const base64 = typeof btoa === "function"
    ? btoa(binary)
    : Buffer.from(bytes).toString("base64");

  return base64
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Generates cryptographically secure random bytes as a base64url string.
 */
export function generateRandomString(byteLength = 32): string {
  const crypto = getCrypto();
  const randomBytes = new Uint8Array(byteLength);
  crypto.getRandomValues(randomBytes);
  return base64UrlEncode(randomBytes);
}

/**
 * Generates an SHA-256 hash formatted as a base64url string.
 */
export async function sha256Base64Url(plainText: string): Promise<string> {
  const crypto = getCrypto();
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(hashBuffer);
}
