'use client';
import Link from 'next/link';
import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CONTENT_KINDS, discoverySearch, type DiscoveryFilters } from '@/lib/discovery';
import { loadDiscovery } from '@/lib/discovery-client';
import { BRANDS } from '@/lib/brand-catalog';
import { useAppStore } from '@/lib/store';
import { SmartImage } from './smart-image';
import {
  DiscoveryCard,
  DiscoverySkeleton,
  DiscoveryNotice,
  DiscoveryAttribution,
} from './discovery-card';
import { BrandEntry } from './brand-entry';
import { HomeWelcome } from './home-welcome';
import { RecommendSection } from './douban-section';

const SHELVES: { title: string; description: string; filters: Partial<DiscoveryFilters> }[] = [
  { title: '大家正在看', description: '从近期热门电影开始', filters: { kind: 'movie', sort: 'U' } },
  {
    title: '值得追的好剧',
    description: '给下一个夜晚，留一点期待',
    filters: { kind: 'tv', sort: 'U' },
  },
  {
    title: '高分电影时光',
    description: '被时间和观众共同记住',
    filters: { kind: 'movie', sort: 'S', minRating: 8 },
  },
  {
    title: '科幻与想象',
    description: '去另一个世界，换一种可能',
    filters: { kind: 'movie', genre: '科幻', sort: 'T' },
  },
  {
    title: '悬疑入夜',
    description: '线索，就藏在故事里',
    filters: { kind: 'tv', genre: '悬疑', sort: 'T' },
  },
  {
    title: '动画的另一种温柔',
    description: '总有一些故事，让想象发光',
    filters: { kind: 'animation', sort: 'U' },
  },
  {
    title: '轻松一下',
    description: '综艺与快乐，都不用太认真',
    filters: { kind: 'variety', sort: 'U' },
  },
  {
    title: '看见真实世界',
    description: '纪录影像里的生活与远方',
    filters: { kind: 'documentary', sort: 'S' },
  },
];
function Shelf({
  shelf,
  onPick,
}: {
  shelf: (typeof SHELVES)[number];
  onPick: (title: string) => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const scroll = (direction: number) => {
    if (!track.current) return;
    track.current.scrollBy({
      left: direction * track.current.clientWidth * 0.85,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  };
  const query = discoverySearch(shelf.filters);
  const result = useQuery({
    queryKey: ['discovery-shelf', query],
    queryFn: ({ signal }) => loadDiscovery(`${query}&count=18`, signal),
    staleTime: 30 * 60 * 1000,
    retry: false,
  });
  return (
    <section className="discovery-shelf" aria-label={shelf.title}>
      <div className="discovery-section-heading">
        <div>
          <h2>{shelf.title}</h2>
          <p>{shelf.description}</p>
        </div>
        <div className="discovery-shelf-actions">
          <button aria-label={`向前浏览${shelf.title}`} onClick={() => scroll(-1)}>
            ‹
          </button>
          <button aria-label={`向后浏览${shelf.title}`} onClick={() => scroll(1)}>
            ›
          </button>
          <Link href={`/browse?${query}`}>
            查看全部 <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
      {result.isPending ? (
        <DiscoverySkeleton />
      ) : result.isError ? (
        <DiscoveryNotice error onRetry={() => void result.refetch()} />
      ) : !result.data.items.length ? (
        <DiscoveryNotice />
      ) : (
        <div ref={track} className="discovery-rail">
          {result.data.items.map((item, index) => (
            <DiscoveryCard
              key={item.id}
              item={item}
              onPick={onPick}
              eager={index < 6 && shelf === SHELVES[0]}
            />
          ))}
        </div>
      )}
    </section>
  );
}
export function DiscoveryHome({ onPick }: { onPick: (title: string) => void }) {
  const enabled = useAppStore((s) => s.doubanEnabled);
  const source = useAppStore((s) => s.recommendSource);
  const mode = useAppStore((s) => s.imageProxyMode);
  const proxy = useAppStore((s) => s.customImageProxy);
  const hero = useQuery({
    queryKey: ['discovery-shelf', discoverySearch(SHELVES[0].filters)],
    queryFn: ({ signal }) =>
      loadDiscovery(`${discoverySearch(SHELVES[0].filters)}&count=18`, signal),
    enabled,
    staleTime: 30 * 60 * 1000,
    retry: false,
  });
  const feature = hero.data?.items.find((i) => i.cover);
  return (
    <div className="discovery-home">
      <div className="discovery-page-heading">
        <div>
          <p className="discovery-kicker">为好故事，留一点时间</p>
          <h1>现在观看</h1>
          <p>发现想看的下一部，也重逢那些值得回味的作品。</p>
        </div>
        <Link className="discovery-text-link" href="/browse">
          探索全部分类 ↗
        </Link>
      </div>
      <nav className="discovery-kind-shortcuts" aria-label="按内容类型发现">
        {CONTENT_KINDS.map((kind, index) => (
          <Link key={kind.id} href={`/browse?kind=${kind.id}`}>
            <span className="discovery-kind-symbol" aria-hidden="true">
              {['▰', '▤', '✧', '◈', '◎'][index]}
            </span>
            <span>
              <strong>{kind.label}</strong>
              <small>{kind.hint}</small>
            </span>
            <span aria-hidden="true">›</span>
          </Link>
        ))}
      </nav>
      {enabled ? (
        <div className="discovery-feature-layout">
          <section
            className={`discovery-feature ${feature ? '' : 'is-loading'}`}
            aria-label="本期电影推荐"
          >
            {feature && (
              <>
                <SmartImage
                  url={feature.cover}
                  mode={mode}
                  customProxy={proxy}
                  alt=""
                  className="discovery-feature-bg"
                  loading="eager"
                />
                <div className="discovery-feature-shade" />
                <SmartImage
                  url={feature.cover}
                  mode={mode}
                  customProxy={proxy}
                  alt={`${feature.title}海报`}
                  className="discovery-feature-poster"
                  loading="eager"
                />
              </>
            )}
            <div className="discovery-feature-copy">
              <p className="discovery-feature-label">今日放映 · 热门电影</p>
              <h2>
                {feature?.title ||
                  (hero.isError ? '好故事，值得慢慢发现。' : '下一段故事，即将开场。')}
              </h2>
              <p className="discovery-feature-meta">
                {feature
                  ? [
                      feature.rating ? `豆瓣 ${feature.rating.toFixed(1)}` : '',
                      feature.year,
                      feature.genres.slice(0, 3).join(' / '),
                    ]
                      .filter(Boolean)
                      .join(' · ')
                  : '从一部电影开始，把这一刻留给自己。'}
              </p>
              {feature ? (
                <button className="discovery-button" onClick={() => onPick(feature.title)}>
                  查看片源 <span aria-hidden="true">↗</span>
                </button>
              ) : (
                <Link href="/browse" className="discovery-button">
                  浏览分类 ↗
                </Link>
              )}
            </div>
          </section>
          <Link href="/brands" className="discovery-editorial">
            <span className="discovery-kicker">厂牌与平台</span>
            <div className="discovery-editorial-logos">
              {BRANDS.slice(0, 4).map((b) => (
                <div key={b.id} className={`brand-logo-well brand-${b.id}`}>
                  <SmartImage url={b.logo} mode="direct" alt={b.name} />
                </div>
              ))}
            </div>
            <h2>
              循着厂牌，
              <br />
              找到你的偏爱。
            </h2>
            <p>从 HBO 的长篇叙事，到吉卜力的奇妙世界。</p>
            <span className="discovery-text-link">探索 8 个专区 ↗</span>
          </Link>
        </div>
      ) : (
        <div className="discovery-disabled">
          首页推荐已关闭。<Link href="/settings">前往设置开启</Link>
          <span>你仍可通过上方分类和搜索发现影片。</span>
        </div>
      )}
      <HomeWelcome />
      {enabled &&
        SHELVES.slice(0, 2).map((shelf) => (
          <Shelf key={shelf.title} shelf={shelf} onPick={onPick} />
        ))}
      <section className="discovery-brands" aria-label="厂牌快捷入口">
        <div className="discovery-section-heading">
          <div>
            <h2>从你喜欢的厂牌开始</h2>
            <p>不同的创作视角，一样的好故事</p>
          </div>
          <Link href="/brands">全部专区 ↗</Link>
        </div>
        <div className="brand-shortcut-grid">
          {BRANDS.map((brand) => (
            <BrandEntry key={brand.id} brand={brand} compact />
          ))}
        </div>
      </section>
      {enabled &&
        SHELVES.slice(2).map((shelf) => <Shelf key={shelf.title} shelf={shelf} onPick={onPick} />)}
      {enabled && source !== 'douban' && (
        <section className="discovery-extra">
          <div className="discovery-section-heading">
            <div>
              <h2>{source === 'bangumi' ? '新番放送' : '本周热榜'}</h2>
              <p>你在设置中选择的推荐频道</p>
            </div>
          </div>
          <RecommendSection onPick={onPick} />
        </section>
      )}
      <DiscoveryAttribution />
    </div>
  );
}
