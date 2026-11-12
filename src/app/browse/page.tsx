'use client';
import { Suspense, useOptimistic, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  CONTENT_KINDS,
  DECADES,
  GENRES,
  REGIONS,
  SORTS,
  mergeDiscoveryPages,
  nextDiscoveryPage,
  parseDiscoveryFilters,
} from '@/lib/discovery';
import {
  DiscoveryAttribution,
  DiscoveryCard,
  DiscoveryNotice,
  DiscoverySkeleton,
} from '@/components/discovery-card';
import { loadDiscovery } from '@/lib/discovery-client';
import { SiteFooter } from '@/components/site-footer';

export default function BrowsePage() {
  return (
    <Suspense>
      <BrowseContent />
    </Suspense>
  );
}
function BrowseContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [optimisticParams, setOptimisticParams] = useOptimistic(params.toString());
  const [, startTransition] = useTransition();
  const filters = parseDiscoveryFilters(new URLSearchParams(optimisticParams));
  const change = (values: Record<string, string>) => {
    // Keep rapid successive selections together while a previous URL navigation
    // is still committing. Browser back/forward remains the source of truth.
    const p = new URLSearchParams(optimisticParams);
    for (const [key, value] of Object.entries(values)) {
      if (value) p.set(key, value);
      else p.delete(key);
    }
    startTransition(() => {
      setOptimisticParams(p.toString());
      router.push(`/browse?${p}`, { scroll: false });
    });
  };
  const key = JSON.stringify(filters);
  const query = useInfiniteQuery({
    queryKey: ['discovery-browser', key],
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      loadDiscovery(`${optimisticParams}&start=${pageParam}&count=30`, signal),
    getNextPageParam: nextDiscoveryPage,
    staleTime: 30 * 60 * 1000,
    retry: false,
  });
  const items = mergeDiscoveryPages(query.data?.pages ?? []);
  const currentKind = CONTENT_KINDS.find((k) => k.id === filters.kind)!;
  const hasFilters = Boolean(
    filters.genre || filters.region || filters.decade || filters.minRating,
  );
  const genres = filters.kind === 'variety' ? ['真人秀', '脱口秀', '音乐', '歌舞'] : GENRES;
  return (
    <div>
      <main className="haru-page discovery-browser">
        <div className="discovery-page-heading">
          <div>
            <p className="discovery-kicker">按你的喜好，慢慢挑选</p>
            <h1>分类浏览</h1>
            <p>从题材、地区和年代出发，找到此刻想看的故事。</p>
          </div>
          <Link className="discovery-text-link" href="/brands">
            探索厂牌专区 ↗
          </Link>
        </div>
        <div className="discovery-filter-panel">
          <div className="discovery-type-tabs" role="group" aria-label="内容类型">
            {CONTENT_KINDS.map((kind) => (
              <button
                key={kind.id}
                aria-pressed={filters.kind === kind.id}
                onClick={() => change({ kind: kind.id, genre: '' })}
              >
                {kind.label}
              </button>
            ))}
          </div>
          <div className="discovery-genre-filter" role="group" aria-label="题材">
            <span>题材</span>
            <div>
              {['', ...genres].map((genre) => (
                <button
                  key={genre}
                  aria-pressed={filters.genre === genre}
                  onClick={() => change({ genre })}
                >
                  {genre || '全部题材'}
                </button>
              ))}
            </div>
          </div>
          <div className="discovery-select-filters">
            <label>
              国家 / 地区
              <select value={filters.region} onChange={(e) => change({ region: e.target.value })}>
                <option value="">全部地区</option>
                {REGIONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
            <label>
              上映年代
              <select value={filters.decade} onChange={(e) => change({ decade: e.target.value })}>
                <option value="">全部年代</option>
                {DECADES.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </label>
            <label>
              豆瓣评分
              <select
                value={filters.minRating || ''}
                onChange={(e) =>
                  change({ rating: e.target.value, ...(e.target.value ? { sort: 'S' } : {}) })
                }
              >
                <option value="">不限评分</option>
                <option value="8">8 分及以上</option>
                <option value="9">9 分及以上</option>
              </select>
            </label>
            <label>
              排序方式
              <select value={filters.sort} onChange={(e) => change({ sort: e.target.value })}>
                {SORTS.map((s) => (
                  <option value={s.id} key={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {hasFilters && (
            <div className="discovery-active-filters">
              <span>已选</span>
              {[
                ['genre', filters.genre],
                ['region', filters.region],
                ['decade', filters.decade],
                ['rating', filters.minRating ? `${filters.minRating} 分及以上` : ''],
              ]
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <button key={k} onClick={() => change({ [k]: '' })} aria-label={`移除筛选：${v}`}>
                    {v} <span aria-hidden="true">×</span>
                  </button>
                ))}
              <button
                className="discovery-reset"
                onClick={() => change({ genre: '', region: '', decade: '', rating: '' })}
              >
                清除筛选
              </button>
            </div>
          )}
        </div>
        <div className="discovery-results-heading">
          <h2>
            {filters.genre || currentKind.label}
            <span>
              {filters.region || '全部地区'} · {filters.decade || '全部年代'}
            </span>
          </h2>
          <span role="status" aria-live="polite">
            {query.isPending ? '正在发现好故事…' : `已加载 ${items.length} 部`}
          </span>
        </div>
        {query.isPending ? (
          <DiscoverySkeleton count={12} />
        ) : query.isError && !items.length ? (
          <DiscoveryNotice error onRetry={() => void query.refetch()} />
        ) : items.length ? (
          <div className="discovery-grid">
            {items.map((item) => (
              <DiscoveryCard
                key={item.id}
                item={item}
                onPick={(title) => router.push(`/?s=${encodeURIComponent(title)}`)}
              />
            ))}
          </div>
        ) : (
          <DiscoveryNotice
            onRetry={() => change({ genre: '', region: '', decade: '', rating: '' })}
          />
        )}
        <div className="discovery-load-more">
          {query.isFetchNextPageError && (
            <p role="alert">下一页暂时没能加载，已显示的影片会保留。</p>
          )}
          {query.hasNextPage && (
            <button
              className="discovery-button secondary"
              disabled={query.isFetching}
              onClick={() => void query.fetchNextPage()}
            >
              {query.isFetching
                ? '加载中…'
                : query.isFetchNextPageError
                  ? '重试加载更多'
                  : '加载更多影片'}{' '}
              <span aria-hidden="true">↓</span>
            </button>
          )}
          {!query.hasNextPage && !query.isPending && !query.isError && items.length > 0 && (
            <p>已经看到这一分类的最后一页了。</p>
          )}
        </div>
        <DiscoveryAttribution />
      </main>
      <SiteFooter />
    </div>
  );
}
