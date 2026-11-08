// ponytail: in-memory cache only; static game data, one fetch per value per session
const cache = new Map<string, Promise<unknown>>();

export function cachedJson<T>(url: string): Promise<T> {
  let entry = cache.get(url);
  if (!entry) {
    entry = fetch(url).then((res) => {
      if (!res.ok) throw new Error(`fetch failed: ${res.status} ${url}`);
      return res.json() as Promise<T>;
    });
    cache.set(url, entry);
    entry.catch(() => cache.delete(url));
  }
  return entry as Promise<T>;
}
