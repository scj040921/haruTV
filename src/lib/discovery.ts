/** Shared discovery vocabulary. Only documented-by-response public tags are sent upstream. */
export const CONTENT_KINDS = [
  { id: 'movie', label: '电影', hint: '银幕上的好故事' },
  { id: 'tv', label: '剧集', hint: '一集接一集的精彩' },
  { id: 'variety', label: '综艺', hint: '放松一下，快乐开场' },
  { id: 'animation', label: '动漫', hint: '想象力没有边界' },
  { id: 'documentary', label: '纪录片', hint: '看见真实的世界' },
] as const;
export type ContentKind = (typeof CONTENT_KINDS)[number]['id'];
export const GENRES = [
  '剧情',
  '喜剧',
  '爱情',
  '动作',
  '科幻',
  '悬疑',
  '犯罪',
  '惊悚',
  '冒险',
  '奇幻',
  '动画',
  '家庭',
  '历史',
  '战争',
  '恐怖',
  '音乐',
  '歌舞',
  '传记',
  '武侠',
  '古装',
  '灾难',
  '运动',
  '真人秀',
  '脱口秀',
  '纪录片',
];
export const REGIONS = [
  '中国大陆',
  '中国香港',
  '中国台湾',
  '美国',
  '英国',
  '日本',
  '韩国',
  '法国',
  '德国',
  '意大利',
  '西班牙',
  '印度',
  '泰国',
  '加拿大',
  '澳大利亚',
  '俄罗斯',
];
export const DECADES = ['2020年代', '2010年代', '2000年代', '1990年代', '1980年代', '1970年代'];
export const SORTS = [
  { id: 'T', label: '综合推荐' },
  { id: 'U', label: '近期热度' },
  { id: 'R', label: '上映时间' },
  { id: 'S', label: '高分优先' },
] as const;
export interface DiscoveryFilters {
  kind: ContentKind;
  genre: string;
  region: string;
  decade: string;
  sort: string;
  minRating: number;
}
export interface DiscoveryItem {
  id: string;
  title: string;
  cover: string;
  rating: number | null;
  year: string;
  kind: 'movie' | 'tv';
  genres: string[];
  countries: string[];
  subtitle: string;
  sourceUrl: string;
}
export interface DiscoveryPage {
  items: DiscoveryItem[];
  nextStart: number | null;
}
export function parseDiscoveryFilters(params: URLSearchParams): DiscoveryFilters {
  const oneOf = (key: string, values: readonly string[], fallback = '') =>
    values.includes(params.get(key) || '') ? params.get(key)! : fallback;
  return {
    kind: oneOf(
      'kind',
      CONTENT_KINDS.map((k) => k.id),
      'movie',
    ) as ContentKind,
    genre: oneOf('genre', GENRES),
    region: oneOf('region', REGIONS),
    decade: oneOf('decade', DECADES),
    sort: oneOf(
      'sort',
      SORTS.map((s) => s.id),
      'U',
    ),
    minRating: ['8', '9'].includes(params.get('rating') || '') ? Number(params.get('rating')) : 0,
  };
}
export function discoverySearch(filters: Partial<DiscoveryFilters> = {}) {
  const p = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) p.set(key === 'minRating' ? 'rating' : key, String(value));
  }
  return p.toString();
}
export function discoveryUpstreamUrl(filters: DiscoveryFilters, start: number, count: number) {
  const tv = ['tv', 'variety', 'animation'].includes(filters.kind);
  const fixedTag =
    filters.kind === 'animation'
      ? '动画'
      : filters.kind === 'documentary'
        ? '纪录片'
        : filters.kind === 'variety'
          ? '综艺'
          : '';
  // The upstream silently ignores year_range/score_range. Decades are real tags;
  // a minimum score is enforced on normalized metadata below, never claimed from ignored parameters.
  const tags = [
    ...new Set([fixedTag, filters.genre, filters.region, filters.decade].filter(Boolean)),
  ];
  const p = new URLSearchParams({
    refresh: '0',
    start: String(start),
    count: String(count),
    selected_categories: JSON.stringify({
      类型: tv ? (filters.kind === 'variety' ? '综艺' : '电视剧') : '电影',
    }),
    uncollect: 'false',
    tags: tags.join(','),
    sort: filters.sort,
  });
  return `https://m.douban.com/rexxar/api/v2/${tv ? 'tv' : 'movie'}/recommend?${p}`;
}
export function normalizeDiscoveryItems(
  raw: unknown,
  fallbackKind: 'movie' | 'tv',
): DiscoveryItem[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  return raw.flatMap((value: unknown) => {
    if (!value || typeof value !== 'object') return [];
    const s = value as Record<string, unknown>;
    const id = String(s.id ?? '');
    if (!/^\d+$/.test(id) || typeof s.title !== 'string' || !s.title.trim() || seen.has(id))
      return [];
    seen.add(id);
    const pic = s.pic as { large?: string; normal?: string } | undefined;
    const r = (s.rating as { value?: number } | null)?.value;
    const parts = typeof s.card_subtitle === 'string' ? s.card_subtitle.split(' / ') : [];
    const cover = pic?.large || pic?.normal || '';
    return [
      {
        id,
        title: s.title.trim(),
        cover: /^https?:\/\//.test(cover) ? cover : '',
        rating: typeof r === 'number' && r > 0 && r <= 10 ? r : null,
        year: typeof s.year === 'string' ? s.year : '',
        kind: s.type === 'tv' ? 'tv' : s.type === 'movie' ? 'movie' : fallbackKind,
        genres: parts[2]?.split(' ').filter(Boolean) ?? [],
        countries: parts[1]?.split(' ').filter(Boolean) ?? [],
        subtitle: parts.slice(0, 3).join(' · '),
        sourceUrl: `https://movie.douban.com/subject/${id}/`,
      },
    ];
  });
}
export function mergeDiscoveryPages(pages: DiscoveryPage[]) {
  const seen = new Set<string>();
  return pages.flatMap((page) =>
    page.items.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    }),
  );
}
export function nextDiscoveryPage(last: DiscoveryPage, pages: DiscoveryPage[]) {
  if (last.nextStart === null) return undefined;
  if (last.items.length && pages.length > 1) {
    const previous = new Set(pages.slice(0, -1).flatMap((p) => p.items.map((i) => i.id)));
    if (last.items.every((i) => previous.has(i.id))) return undefined;
  }
  return last.nextStart;
}
