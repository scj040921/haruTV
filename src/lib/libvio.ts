import type { SourceConfig, SearchResultItem, VideoDetail } from './types';
export const LIBVIO_ORIGIN = 'https://www.libvio.in';
export interface LibvioViewRequest {
  action: 'attach' | 'bounds' | 'state' | 'seek' | 'close';
  url?: string;
  time?: number;
  bounds?: { x: number; y: number; width: number; height: number; visible: boolean };
}
export interface LibvioViewState {
  ready?: boolean;
  width?: number;
  height?: number;
  time?: number;
  duration?: number;
  paused?: boolean;
  ended?: boolean;
  decodedFrames?: number;
  error?: string;
}
export function isLibvioSource(source: Pick<SourceConfig, 'url'>) {
  try {
    return new URL(source.url).origin === LIBVIO_ORIGIN;
  } catch {
    return false;
  }
}
export function isLibvioPlayUrl(value: string) {
  try {
    const u = new URL(value);
    return (
      u.origin === LIBVIO_ORIGIN &&
      /^\/w\/\d+-\d+-\d+\.html$/.test(u.pathname) &&
      !u.search &&
      !u.hash
    );
  } catch {
    return false;
  }
}
function documentOf(html: string) {
  return new DOMParser().parseFromString(html, 'text/html');
}
function absolute(value: string | null) {
  if (!value?.trim()) return '';
  try {
    const u = new URL(value || '', LIBVIO_ORIGIN);
    return ['https:', 'http:'].includes(u.protocol) ? u.href : '';
  } catch {
    return '';
  }
}
export function parseLibvioSearch(html: string, source: SourceConfig): SearchResultItem[] {
  const doc = documentOf(html),
    seen = new Set<string>();
  return [...doc.querySelectorAll('.stui-vodlist__box')].flatMap((card) => {
    const link = card.querySelector<HTMLAnchorElement>('a[href*="/detail/"]');
    const id = link?.getAttribute('href')?.match(/^\/detail\/(\d+)\.html$/)?.[1];
    const name =
      card.querySelector('.stui-vodlist__detail .title')?.textContent?.trim() ||
      link?.getAttribute('title')?.trim();
    if (!id || !name || seen.has(id)) return [];
    seen.add(id);
    const pic =
      card.querySelector('[data-original]')?.getAttribute('data-original') ||
      card.querySelector('img')?.getAttribute('src');
    return [
      {
        sourceKey: source.key,
        sourceName: source.name,
        sourceUrl: source.url,
        vodId: id,
        name,
        pic: pic ? absolute(pic) : undefined,
        remarks: card.querySelector('.pic-text')?.textContent?.trim(),
      },
    ];
  });
}
export function parseLibvioDetail(html: string, source: SourceConfig, id: string): VideoDetail {
  const doc = documentOf(html),
    base = id.split('-')[0],
    requested = id.split('-')[1];
  const groups = [...doc.querySelectorAll('.playlist-panel:not(.netdisk-panel)')].flatMap(
    (panel) => {
      const links = [...panel.querySelectorAll<HTMLAnchorElement>('a[href^="/w/"]')].filter(
        (link) => link.getAttribute('href')?.startsWith(`/w/${base}-`),
      );
      const sid = links[0]?.getAttribute('href')?.match(/-(\d+)-\d+\.html$/)?.[1];
      if (!sid) return [];
      return [
        {
          id: `${base}-${sid}`,
          name: panel.querySelector('h3,h4')?.textContent?.trim() || `线路 ${sid}`,
          episodes: [...new Set(links.map((link) => absolute(link.getAttribute('href'))))],
        },
      ];
    },
  );
  const selected =
    groups.find((g) => g.id === `${base}-${requested}`) ||
    groups.find((g) => /BD5|4K|蓝光|1080/i.test(g.name)) ||
    groups[0];
  if (!selected?.episodes.length)
    throw new Error('LIBVIO 该影片未提供网页播放线路，网盘内容不导入');
  const metas = [...doc.querySelectorAll('.vod-meta')].map(
    (n) => n.textContent?.replace(/\s+/g, ' ').trim() || '',
  );
  return {
    episodes: selected.episodes,
    playLines: groups.map(({ id, name }) => ({ id, name })),
    activePlayLine: selected.id,
    videoInfo: {
      title: doc.querySelector('.vod-info h1,h1')?.textContent?.trim(),
      cover: absolute(
        doc.querySelector('.vod-poster img')?.getAttribute('data-original') ||
          doc.querySelector('.vod-poster img')?.getAttribute('src') ||
          '',
      ),
      desc: doc.querySelector('.vod-desc')?.textContent?.trim(),
      year: metas.join(' ').match(/(?:19|20)\d{2}/)?.[0],
      remarks: selected.name,
      sourceKey: source.key,
      sourceName: source.name,
      sourceUrl: source.url,
    },
  };
}
export async function libvioRequest(
  request: {
    action: 'search' | 'detail' | 'resolve' | 'page' | 'test' | 'verify';
    query?: string;
    id?: string;
    url?: string;
  },
  signal?: AbortSignal,
) {
  signal?.throwIfAborted();
  if (!window.haruDesktop?.libvio) throw new Error('LIBVIO 网页源需要使用 haruTV 桌面客户端');
  const result = await window.haruDesktop.libvio(request);
  signal?.throwIfAborted();
  if (result.error) throw new Error(result.error);
  return result;
}
