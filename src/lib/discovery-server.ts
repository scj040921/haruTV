import {
  discoveryUpstreamUrl,
  normalizeDiscoveryItems,
  type DiscoveryFilters,
  type DiscoveryPage,
} from './discovery';
import { fetchUpstream, getCache, setCache } from './fetch-utils';

const pending = new Map<string, Promise<DiscoveryPage>>();
export async function fetchDiscovery(
  filters: DiscoveryFilters,
  start: number,
  count: number,
): Promise<DiscoveryPage> {
  const url = discoveryUpstreamUrl(filters, start, count);
  const key = `discover:${url}:${filters.minRating}`;
  const cached = getCache<DiscoveryPage>(key);
  if (cached) return cached;
  const existing = pending.get(key);
  if (existing) return existing;
  const task = (async () => {
    const res = await fetchUpstream(url, {
      timeoutMs: 12000,
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Referer: 'https://m.douban.com/movie/',
        Accept: 'application/json',
      },
    });
    if (!res.ok) throw new Error('推荐服务暂时不可用，请稍后重试');
    const raw = await res.json();
    // Authentication/rate-limit responses are errors, never an empty catalogue.
    if (!Array.isArray(raw.items)) throw new Error('推荐服务暂时不可用，请稍后重试');
    const normalized = normalizeDiscoveryItems(
      raw.items,
      ['tv', 'variety', 'animation'].includes(filters.kind) ? 'tv' : 'movie',
    );
    const items = normalized.filter(
      (item) => !filters.minRating || (item.rating ?? 0) >= filters.minRating,
    );
    const exhaustedRating =
      filters.sort === 'S' &&
      filters.minRating > 0 &&
      normalized.some((i) => i.rating !== null && i.rating < filters.minRating);
    const page = {
      items,
      nextStart:
        !raw.items.length || exhaustedRating || start + count >= 5000 ? null : start + count,
    };
    setCache(key, page, 30 * 60 * 1000);
    return page;
  })();
  pending.set(key, task);
  try {
    return await task;
  } finally {
    pending.delete(key);
  }
}
