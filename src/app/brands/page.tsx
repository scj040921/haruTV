'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { BrandDirectoryPage } from '@/lib/brand-directory';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BRANDS, BRAND_CATALOG_DATE } from '@/lib/brand-catalog';
import { DiscoveryCard, DiscoveryNotice, DiscoverySkeleton } from '@/components/discovery-card';
import { BrandEntry } from '@/components/brand-entry';
import { SiteFooter } from '@/components/site-footer';

export default function BrandsPage() {
  return (
    <Suspense>
      <BrandContent />
    </Suspense>
  );
}
function BrandContent() {
  const params = useSearchParams();
  const router = useRouter();
  const brand = BRANDS.find((b) => b.id === params.get('brand'));
  // Mount a fresh selection when changing brands so previous hidden filters never leak.
  return (
    <div>
      <main className="haru-page discovery-brand-page">
        <div className="discovery-page-heading">
          <div>
            <p className="discovery-kicker">沿着创作的风格，发现更多</p>
            <h1>厂牌专区</h1>
            <p>从原创平台到电影工作室，每个名字背后，都有独特的故事。</p>
          </div>
          <Link href="/browse" className="discovery-text-link">
            按内容分类 ↗
          </Link>
        </div>
        <div
          className={brand ? 'brand-shortcut-grid brand-selector' : 'brand-hub-grid'}
          aria-label="选择厂牌"
        >
          {BRANDS.map((b) => (
            <BrandEntry
              key={b.id}
              brand={b}
              compact={Boolean(brand)}
              selected={b.id === brand?.id}
            />
          ))}
        </div>
        {brand ? (
          <BrandCollection
            key={brand.id}
            brand={brand}
            onPick={(title) => router.push(`/?s=${encodeURIComponent(title)}`)}
          />
        ) : (
          <>
            <div className="discovery-section-heading brand-intro-heading">
              <div>
                <h2>从这些作品开始</h2>
                <p>每个专区，先挑两部认识一下</p>
              </div>
              <span>{BRANDS.reduce((n, b) => n + b.total, 0).toLocaleString()} 条目录记录</span>
            </div>
            <div className="discovery-grid">
              {BRANDS.flatMap((b) => b.items.slice(0, 2)).map((item) => (
                <DiscoveryCard
                  key={item.id}
                  item={item}
                  onPick={(title) => router.push(`/?s=${encodeURIComponent(title)}`)}
                />
              ))}
            </div>
          </>
        )}
        <p className="discovery-catalog-note">
          目录按公开资料中的出品、发行或原创首播关系收录，不同厂牌可能共享作品。小众、新近和未上映作品资料可能不完整；收录不代表可播放或播放授权。更新于{' '}
          {BRAND_CATALOG_DATE}。
        </p>
        <p className="discovery-attribution">
          目录资料：
          <a href="https://www.wikidata.org/" target="_blank" rel="noreferrer">
            Wikidata（CC0）
          </a>
          ；部分海报资料：
          <a href="https://www.tvmaze.com/api" target="_blank" rel="noreferrer">
            TVmaze（CC BY-SA）
          </a>
          、豆瓣。点击影片后搜索已添加片源。
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
function BrandCollection({
  brand,
  onPick,
}: {
  brand: (typeof BRANDS)[number];
  onPick: (title: string) => void;
}) {
  const [keyword, setKeyword] = useState('');
  const [debounced, setDebounced] = useState('');
  const [genre, setGenre] = useState('');
  const [kind, setKind] = useState('');
  const [year, setYear] = useState('');
  const [sort, setSort] = useState('recommend');
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(keyword.trim()), 300);
    return () => clearTimeout(timer);
  }, [keyword]);
  const query = useInfiniteQuery({
    queryKey: ['brand-directory', brand.id, debounced, genre, kind, year, sort],
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }): Promise<BrandDirectoryPage> => {
      const p = new URLSearchParams({
        brand: brand.id,
        q: debounced,
        genre,
        kind,
        year,
        sort,
        page: String(pageParam),
      });
      const res = await fetch(`/api/brands/catalog?${p}`, { signal });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '目录加载失败');
      return data;
    },
    getNextPageParam: (page) => page.nextPage ?? undefined,
    staleTime: 30 * 60 * 1000,
    retry: false,
  });
  const items = useMemo(() => {
    const seen = new Set<string>();
    return (query.data?.pages ?? []).flatMap((p) =>
      p.items.filter((i) => {
        if (seen.has(i.id)) return false;
        seen.add(i.id);
        return true;
      }),
    );
  }, [query.data]);
  const info = query.data?.pages[0];
  const clear = () => {
    setKeyword('');
    setDebounced('');
    setGenre('');
    setKind('');
    setYear('');
  };
  return (
    <section aria-label={`${brand.name}作品目录`}>
      <div className="brand-collection-header">
        <div className={`brand-logo-well brand-${brand.id}`}>
          <Image src={brand.logo} alt={`${brand.name} Logo`} width={180} height={70} unoptimized />
        </div>
        <div>
          <Link href="/brands" className="brand-back">
            ‹ 全部厂牌
          </Link>
          <h2>{brand.name} 作品目录</h2>
          <p>{brand.description} · 按出品、发行或原创首播关系收录</p>
        </div>
        <span>已收录 {(info?.catalogueTotal ?? brand.total).toLocaleString()} 部</span>
      </div>
      <div className="brand-collection-toolbar">
        <input
          aria-label="搜索当前厂牌作品"
          placeholder="搜索整个厂牌目录，支持中文和原名…"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <label className="sr-only" htmlFor="brand-kind">
          作品类型
        </label>
        <select id="brand-kind" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="">全部类型</option>
          <option value="movie">电影 / 短片</option>
          <option value="tv">剧集</option>
        </select>
        <label className="sr-only" htmlFor="brand-genre">
          作品题材
        </label>
        <select id="brand-genre" value={genre} onChange={(e) => setGenre(e.target.value)}>
          <option value="">全部题材</option>
          {info?.genres.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="brand-year">
          作品年份
        </label>
        <select id="brand-year" value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="">全部年份</option>
          {info?.years.map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="brand-sort">
          作品排序
        </label>
        <select id="brand-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="recommend">推荐顺序</option>
          <option value="rating">已知评分优先</option>
          <option value="year">上映时间</option>
          <option value="title">片名字序</option>
        </select>
      </div>
      <div className="brand-result-line">
        <p className="brand-result-count" aria-live="polite">
          {query.isPending
            ? '正在打开作品目录…'
            : `共 ${(info?.total ?? 0).toLocaleString()} 部符合条件 · 已显示 ${items.length} 部`}
        </p>
        {Boolean(debounced || genre || kind || year) && <button onClick={clear}>清除筛选</button>}
      </div>
      {query.isPending ? (
        <DiscoverySkeleton count={12} />
      ) : query.isError && !items.length ? (
        <DiscoveryNotice error onRetry={() => void query.refetch()} />
      ) : items.length ? (
        <div className="discovery-grid">
          {items.map((item) => (
            <DiscoveryCard key={item.id} item={item} onPick={onPick} />
          ))}
        </div>
      ) : (
        <DiscoveryNotice onRetry={clear} />
      )}
      <div className="discovery-load-more">
        {query.isFetchNextPageError && <p role="alert">下一页暂时没能加载，已显示的作品会保留。</p>}
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
                : '加载更多作品'}{' '}
            ↓
          </button>
        )}
        {!query.hasNextPage && !query.isPending && !query.isError && items.length > 0 && (
          <p>已显示当前条件下收录的全部作品。</p>
        )}
      </div>
      <p className="discovery-catalog-note">
        目录包含长片、短片和剧集。部分作品暂无海报、评分或题材，未标注题材的条目不会出现在对应的题材筛选中；无中文译名时显示原名。
      </p>
    </section>
  );
}
