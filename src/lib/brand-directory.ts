import type { DiscoveryItem } from './discovery';

export interface BrandWork extends DiscoveryItem {
  originalTitle: string;
  doubanId: string;
  imdbId: string;
}
export interface BrandDirectoryPage {
  items: BrandWork[];
  total: number;
  catalogueTotal: number;
  nextPage: number | null;
  updatedAt: string;
  genres: string[];
  years: string[];
}
export interface BrandFilters {
  q: string;
  kind: string;
  genre: string;
  year: string;
  sort: string;
  page: number;
}
export function parseBrandFilters(p: URLSearchParams): BrandFilters {
  return {
    q: (p.get('q') || '').trim().slice(0, 100),
    kind: ['movie', 'tv'].includes(p.get('kind') || '') ? p.get('kind')! : '',
    genre: (p.get('genre') || '').slice(0, 20),
    year: /^\d{4}$/.test(p.get('year') || '') ? p.get('year')! : '',
    sort: ['year', 'rating', 'title'].includes(p.get('sort') || '') ? p.get('sort')! : 'recommend',
    page: Math.min(500, Math.max(1, Math.floor(Number(p.get('page')) || 1))),
  };
}
export function searchBrandWorks(all: BrandWork[], filters: BrandFilters, pageSize = 24) {
  const q = filters.q.toLocaleLowerCase();
  const sorted = all
    .filter(
      (item) =>
        (!q || `${item.title} ${item.originalTitle}`.toLocaleLowerCase().includes(q)) &&
        (!filters.kind || item.kind === filters.kind) &&
        (!filters.genre || item.genres.includes(filters.genre)) &&
        (!filters.year || item.year === filters.year),
    )
    .sort((a, b) =>
      filters.sort === 'year'
        ? Number(b.year) - Number(a.year) || a.id.localeCompare(b.id)
        : filters.sort === 'rating'
          ? (b.rating ?? -1) - (a.rating ?? -1) || a.id.localeCompare(b.id)
          : filters.sort === 'title'
            ? a.title.localeCompare(b.title, 'zh-CN')
            : 0,
    );
  const start = (filters.page - 1) * pageSize;
  return {
    items: sorted.slice(start, start + pageSize),
    total: sorted.length,
    catalogueTotal: all.length,
    nextPage: start + pageSize < sorted.length ? filters.page + 1 : null,
    genres: [...new Set(all.flatMap((i) => i.genres))].sort(),
    years: [...new Set(all.map((i) => i.year).filter(Boolean))].sort().reverse(),
  };
}
