interface CacheEntry<T> { value: T; expiresAt: number }

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) { this.store.delete(key); return null; }
    return entry.value;
  }

  async set<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async del(key: string): Promise<void> { this.store.delete(key); }

  async delPattern(prefix: string): Promise<void> {
    for (const k of this.store.keys()) { if (k.startsWith(prefix)) this.store.delete(k); }
  }

  startCleanup(intervalMs = 60_000) {
    setInterval(() => {
      const now = Date.now();
      for (const [k, v] of this.store.entries()) {
        if (now > v.expiresAt) this.store.delete(k);
      }
    }, intervalMs).unref();
  }
}

let _cache: MemoryCache;
export function getCache(): MemoryCache {
  if (!_cache) { _cache = new MemoryCache(); _cache.startCleanup(); }
  return _cache;
}
