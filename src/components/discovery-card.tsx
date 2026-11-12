'use client';
import { useAppStore } from '@/lib/store';
import type { DiscoveryItem } from '@/lib/discovery';
import { SmartImage } from './smart-image';

export function DiscoveryCard({
  item,
  onPick,
  eager = false,
}: {
  item: DiscoveryItem;
  onPick: (title: string) => void;
  eager?: boolean;
}) {
  const mode = useAppStore((s) => s.imageProxyMode);
  const customProxy = useAppStore((s) => s.customImageProxy);
  return (
    <button
      className="discovery-card"
      onClick={() => onPick(item.title)}
      aria-label={`搜索《${item.title}》的片源`}
      title={item.title}
    >
      <div className="discovery-poster">
        <span className="discovery-poster-placeholder" aria-hidden="true">
          {item.title}
        </span>
        <SmartImage
          url={item.cover}
          mode={mode}
          customProxy={customProxy}
          alt=""
          className="discovery-cover"
          loading={eager ? 'eager' : 'lazy'}
        />
        {item.rating !== null && (
          <span className="discovery-rating">
            <span aria-hidden="true">★</span> {item.rating.toFixed(1)}
          </span>
        )}
        <span className="discovery-card-action" aria-hidden="true">
          查看片源 ↗
        </span>
      </div>
      <h3>{item.title}</h3>
      <p>
        {[item.year, item.genres.slice(0, 2).join(' / ')].filter(Boolean).join(' · ') ||
          (item.kind === 'tv' ? '剧集' : '电影')}
      </p>
    </button>
  );
}
export function DiscoverySkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="discovery-grid" aria-label="正在加载影片" role="status">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="discovery-skeleton">
          <div />
          <span />
          <small />
        </div>
      ))}
    </div>
  );
}
export function DiscoveryNotice({ error, onRetry }: { error?: boolean; onRetry?: () => void }) {
  return (
    <div className="discovery-notice" role="status">
      <span aria-hidden="true">{error ? '↻' : '⌕'}</span>
      <h3>{error ? '这组影片暂时没能加载' : '暂时没有符合条件的影片'}</h3>
      <p>
        {error
          ? '推荐服务可能暂时繁忙，你可以重试或先浏览其他分类。'
          : '试试减少筛选条件，或换一个题材看看。'}
      </p>
      {onRetry && (
        <button className="discovery-button secondary" onClick={onRetry}>
          {error ? '重新加载' : '清除筛选'}
        </button>
      )}
    </div>
  );
}
export function DiscoveryAttribution() {
  return (
    <p className="discovery-attribution">
      影片资料来自{' '}
      <a href="https://movie.douban.com/" target="_blank" rel="noreferrer">
        豆瓣
      </a>
      。点击海报搜索已添加的片源；可播放内容与实际画质以片源为准。
    </p>
  );
}
