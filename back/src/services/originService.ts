import { OAuthClient } from '../models/OAuthClient';

// In‑memory cache with a timestamp
let allowedOriginsCache: Set<string> | null = null;
let lastFetched = 0;
const CACHE_TTL = 60 * 1000; // 1 minute (adjust as needed)

/**
 * Extract origin from a full URL (protocol + hostname)
 */
function extractOrigin(url: string): string | null {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
}

/**
 * Fetch all active clients, collect their redirect URIs, and build a set of origins.
 */
async function buildAllowedOrigins(): Promise<Set<string>> {
  const clients = await OAuthClient.find({ isActive: true }).select('redirectUris');
  const origins = new Set<string>();

  for (const client of clients) {
    for (const uri of client.redirectUris) {
      const origin = extractOrigin(uri);
      if (origin) origins.add(origin);
    }
  }
  return origins;
}

/**
 * Get the current set of allowed origins (cached).
 */
export async function getAllowedOrigins(): Promise<Set<string>> {
  const now = Date.now();
  if (!allowedOriginsCache || now - lastFetched > CACHE_TTL) {
    allowedOriginsCache = await buildAllowedOrigins();
    lastFetched = now;
  }
  return allowedOriginsCache;
}

/**
 * Invalidate the cache (call this after creating/updating a client).
 */
export function invalidateOriginCache() {
  allowedOriginsCache = null;
}