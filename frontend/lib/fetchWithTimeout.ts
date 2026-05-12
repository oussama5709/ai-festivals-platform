const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface FetchResult<T> {
  data: T | null;
  error: 'timeout' | 'offline' | null;
}

export async function serverFetch<T>(
  path: string,
  timeoutMs = 5000
): Promise<FetchResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timer);
    if (!res.ok) return { data: null, error: 'offline' };
    const data = (await res.json()) as T;
    return { data, error: null };
  } catch {
    clearTimeout(timer);
    return { data: null, error: 'timeout' };
  }
}
