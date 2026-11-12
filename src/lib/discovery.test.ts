import { describe, expect, it } from 'vitest';
import {
  discoveryUpstreamUrl,
  mergeDiscoveryPages,
  nextDiscoveryPage,
  normalizeDiscoveryItems,
  parseDiscoveryFilters,
} from './discovery';

describe('discovery boundaries', () => {
  it('limits filters to supported vocabulary rather than forwarding arbitrary tags or URLs', () => {
    const f = parseDiscoveryFilters(
      new URLSearchParams('kind=unknown&genre=https://localhost&region=秘密&sort=xxx&rating=99'),
    );
    expect(f).toEqual({
      kind: 'movie',
      genre: '',
      region: '',
      decade: '',
      sort: 'U',
      minRating: 0,
    });
    expect(new URL(discoveryUpstreamUrl(f, 0, 30)).hostname).toBe('m.douban.com');
  });
  it('uses the effective decade tag instead of the ignored upstream year_range parameter', () => {
    const f = parseDiscoveryFilters(
      new URLSearchParams('kind=movie&genre=科幻&region=美国&decade=2020年代&rating=8&sort=S'),
    );
    const p = new URL(discoveryUpstreamUrl(f, 30, 24)).searchParams;
    expect(p.get('tags')).toBe('科幻,美国,2020年代');
    expect(p.get('year_range')).toBeNull();
    expect(p.get('start')).toBe('30');
    expect(f.minRating).toBe(8);
  });
  it('treats animation and variety as real TV queries with their fixed content tags', () => {
    for (const [kind, tag] of [
      ['animation', '动画'],
      ['variety', '综艺'],
    ]) {
      const url = new URL(
        discoveryUpstreamUrl(parseDiscoveryFilters(new URLSearchParams({ kind })), 0, 18),
      );
      expect(url.pathname).toContain('/tv/recommend');
      expect(url.searchParams.get('tags')).toBe(tag);
    }
  });
  it('retains public film facts and discards upstream user/comment payloads and malformed entries', () => {
    const items = normalizeDiscoveryItems(
      [
        null,
        { id: 'not-an-id', title: 'bad' },
        {
          id: '123',
          title: '测试电影',
          year: '2024',
          type: 'movie',
          pic: { large: 'https://example.com/poster.jpg' },
          rating: { value: 8.5 },
          card_subtitle: '2024 / 中国大陆 / 剧情 科幻 / 导演',
          comment: { user: 'private' },
          user: { name: 'private' },
        },
        { id: '123', title: 'duplicate' },
      ],
      'movie',
    );
    expect(items).toHaveLength(1);
    expect(items[0].genres).toEqual(['剧情', '科幻']);
    expect(items[0].countries).toEqual(['中国大陆']);
    expect(items[0].rating).toBe(8.5);
    expect(JSON.stringify(items)).not.toContain('private');
  });
  it('stops repeated pages, merges overlap, and keeps advancing empty score-filtered pages', () => {
    const [a, b, c] = normalizeDiscoveryItems(
      ['1', '2', '3'].map((id) => ({ id, title: id })),
      'movie',
    );
    const first = { items: [a, b], nextStart: 30 };
    const overlap = { items: [b, c], nextStart: 60 };
    expect(mergeDiscoveryPages([first, overlap]).map((x) => x.id)).toEqual(['1', '2', '3']);
    expect(nextDiscoveryPage(overlap, [first, overlap])).toBe(60);
    expect(
      nextDiscoveryPage({ items: [b, a], nextStart: 60 }, [
        first,
        { items: [b, a], nextStart: 60 },
      ]),
    ).toBeUndefined();
    expect(
      nextDiscoveryPage({ items: [], nextStart: 60 }, [first, { items: [], nextStart: 60 }]),
    ).toBe(60);
    expect(nextDiscoveryPage({ items: [], nextStart: null }, [first])).toBeUndefined();
  });
});
