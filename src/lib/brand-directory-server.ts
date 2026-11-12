import snapshot from './catalog/directory.json';
import type { BrandWork, BrandFilters, BrandDirectoryPage } from './brand-directory';
import { searchBrandWorks } from './brand-directory';
import { fetchUpstream, getCache, setCache } from './fetch-utils';

const catalogues = snapshot.brands as Record<string, BrandWork[]>;
export function getBrandDirectory(brand: string, filters: BrandFilters): BrandDirectoryPage | null {
  const all = Object.hasOwn(catalogues, brand) ? catalogues[brand] : undefined;
  if (!all) return null;
  const result = searchBrandWorks(all, filters);
  return {
    ...result,
    updatedAt: snapshot.updatedAt,
    items: result.items.map((item) => ({
      ...item,
      cover:
        item.cover ||
        (item.doubanId || (item.kind === 'tv' && item.imdbId)
          ? `/api/brands/poster?brand=${brand}&id=${item.id}`
          : ''),
    })),
  };
}

// Public metadata only. A single queue limits bursts from poster grids; access
// restrictions pause that provider instead of retrying it through another identity.
let queue = Promise.resolve();
const paused = new Map<string, number>();
const inflight = new Map<string, Promise<string | null>>();
async function limitedJson(provider: string, url: string) {
  if ((paused.get(provider) || 0) > Date.now()) return null;
  const turn = queue;
  queue = turn.then(() => new Promise<void>((resolve) => setTimeout(resolve, 550)));
  await turn;
  try {
    if ((paused.get(provider) || 0) > Date.now()) return null;
    const res = await fetchUpstream(url, {
      timeoutMs: 7000,
      headers: {
        'User-Agent': 'haruTV/0.4 (film catalogue metadata)',
        Referer: 'https://m.douban.com/movie/',
        Accept: 'application/json',
      },
    });
    if ([401, 403, 429].includes(res.status)) paused.set(provider, Date.now() + 60 * 60_000);
    const data = await res.json().catch(() => null);
    // Some public endpoints signal their IP/login restriction with HTTP 400.
    // Do not keep probing it merely because the status is not 401/403/429.
    if (
      data?.code === 1309 ||
      /rate_limit|login_required|authentication/i.test(String(data?.msg || ''))
    ) {
      paused.set(provider, Date.now() + 60 * 60_000);
      return null;
    }
    return res.ok ? data : null;
  } catch {
    return null;
  }
}
export async function getBrandPoster(brand: string, id: string): Promise<string | null> {
  const item = Object.hasOwn(catalogues, brand)
    ? catalogues[brand].find((i) => i.id === id)
    : undefined;
  if (!item) return null;
  if (item.cover) return item.cover;
  const key = `brand-poster:${id}`;
  const cached = getCache<{ cover: string | null }>(key);
  if (cached) return cached.cover;
  const running = inflight.get(key);
  if (running) return running;
  const task = (async () => {
    let cover: string | null = null;
    if (/^\d+$/.test(item.doubanId)) {
      const raw = await limitedJson(
        'douban',
        `https://m.douban.com/rexxar/api/v2/${item.kind}/${item.doubanId}`,
      );
      const url = raw?.pic?.large;
      if (typeof url === 'string' && /^https:\/\//.test(url)) cover = url;
    }
    if (!cover && item.kind === 'tv' && /^tt\d+$/.test(item.imdbId)) {
      const raw = await limitedJson(
        'tvmaze',
        `https://api.tvmaze.com/lookup/shows?imdb=${item.imdbId}`,
      );
      const url = raw?.externals?.imdb === item.imdbId ? raw?.image?.medium : null;
      if (typeof url === 'string' && /^https:\/\//.test(url)) cover = url;
    }
    setCache(key, { cover }, cover ? 24 * 60 * 60_000 : 30 * 60_000);
    return cover;
  })();
  inflight.set(key, task);
  try {
    return await task;
  } finally {
    inflight.delete(key);
  }
}
