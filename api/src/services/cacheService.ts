import { LRUCache } from 'lru-cache';

const cache = new LRUCache<string, object>({
  max: 500,
  ttl: 1000 * 60 * 5, // 5 min TTL
});

export function getCached<T extends object>(key: string): T | undefined {
  return cache.get(key) as T | undefined;
}

export function setCached<T extends object>(key: string, value: T): void {
  cache.set(key, value);
}

export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}
