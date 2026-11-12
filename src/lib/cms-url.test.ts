import { describe, expect, it } from 'vitest';
import { cmsApiUrl } from './cms-parser';
describe('TVBox CMS URL compatibility', () => {
  it('replaces a subscription action and preserves its access parameters', () => {
    const u = new URL(cmsApiUrl('https://example.com/api.php/provide/vod/?ac=list&token=test-token', { ac: 'videolist', ids: 42 }));
    expect(u.searchParams.getAll('ac')).toEqual(['videolist']);
    expect(u.searchParams.get('ids')).toBe('42');
    expect(u.searchParams.get('token')).toBe('test-token');
  });
  it('clears stale search and paging parameters when loading details', () => {
    const u = new URL(cmsApiUrl('https://example.com/vod?wd=old&pg=5&ids=1', { ac: 'videolist', ids: 2 }));
    expect(u.searchParams.has('wd')).toBe(false);
    expect(u.searchParams.has('pg')).toBe(false);
    expect(u.searchParams.get('ids')).toBe('2');
  });
  it('encodes Chinese keywords once and retains a source path', () => {
    const u = new URL(cmsApiUrl('http://小胡.icu/api.php/provide/vod', { ac: 'videolist', wd: '电影 & 故事', pg: 1 }));
    expect(u.pathname).toBe('/api.php/provide/vod');
    expect(u.searchParams.get('wd')).toBe('电影 & 故事');
    expect(u.searchParams.get('pg')).toBe('1');
  });
});
