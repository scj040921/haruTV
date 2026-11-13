import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { DOMParser } from 'linkedom';
import { isLibvioPlayUrl, isLibvioSource, parseLibvioDetail, parseLibvioSearch } from './libvio';
import { createRequire } from 'node:module';
const native = createRequire(import.meta.url)('../../desktop/libvio.cjs') as {
  pagePath: (input: unknown) => string;
  mediaUrl: (url: string) => string | null;
  fullscreenAllowed: (permission: string, url: string) => boolean;
};
const source = { key: 'test-libvio', name: 'LIBVIO', url: 'https://www.libvio.in' };
beforeEach(() => vi.stubGlobal('DOMParser', DOMParser));
afterEach(() => vi.unstubAllGlobals());
it('grants only user-initiated fullscreen for the exact source origin', () => {
  expect(native.fullscreenAllowed('fullscreen', source.url + '/vid/player.php')).toBe(true);
  expect(native.fullscreenAllowed('fullscreen', 'https://www.libvio.in.attacker.test')).toBe(false);
  expect(native.fullscreenAllowed('automatic-fullscreen', source.url)).toBe(false);
  expect(native.fullscreenAllowed('media', source.url)).toBe(false);
  expect(native.fullscreenAllowed('fullscreen', 'invalid')).toBe(false);
});
it('recognizes only the supported origin and exact public play paths', () => {
  expect(isLibvioSource(source)).toBe(true);
  expect(isLibvioSource({ url: 'https://www.libvio.in.attacker.test' })).toBe(false);
  expect(isLibvioPlayUrl('https://www.libvio.in/w/123-3-1.html')).toBe(true);
  expect(isLibvioPlayUrl('https://www.libvio.in/w/123-3-1.html?redirect=http://localhost')).toBe(
    false,
  );
});
it('parses inert search cards, drops unsafe links and duplicates, and does not execute script', () => {
  const html = `<script>throw new Error('must not execute')</script><div class="stui-vodlist__box"><a href="/detail/123.html" title="测试影片" data-original="https://example.org/poster.jpg"></a><div class="stui-vodlist__detail"><h4 class="title">测试影片</h4></div></div><div class="stui-vodlist__box"><a href="/detail/123.html" title="重复"></a></div><div class="stui-vodlist__box"><a href="javascript:alert(1)" title="不安全"></a></div>`;
  const items = parseLibvioSearch(html, source);
  expect(items).toHaveLength(1);
  expect(items[0]).toMatchObject({
    vodId: '123',
    name: '测试影片',
    sourceKey: source.key,
    pic: 'https://example.org/poster.jpg',
  });
});
it('keeps actual web playback lines separate and excludes cloud-drive panels', () => {
  const html = `<div class="vod-info"><h1>测试影片</h1></div><div class="vod-meta">年份：2024</div><div class="playlist-panel"><h3>BD5播放</h3><a href="/w/123-3-1.html">第一集</a><a href="/w/123-3-2.html">第二集</a></div><div class="playlist-panel"><h3>备用播放</h3><a href="/w/123-4-1.html">第一集</a></div><div class="playlist-panel netdisk-panel"><h3>网盘</h3><a href="https://example.org/share">网盘</a></div>`;
  const detail = parseLibvioDetail(html, source, '123-4');
  expect(detail.playLines).toEqual([
    { id: '123-3', name: 'BD5播放' },
    { id: '123-4', name: '备用播放' },
  ]);
  expect(detail.episodes).toEqual(['https://www.libvio.in/w/123-4-1.html']);
  expect(parseLibvioDetail(html, source, '123').episodes).toHaveLength(2);
  expect(detail.videoInfo).toMatchObject({ title: '测试影片', year: '2024' });
});
it('does not import cloud-only films as playable episodes', () => {
  expect(() =>
    parseLibvioDetail(
      '<div class="playlist-panel netdisk-panel"><a href="https://example.org/share">下载</a></div>',
      source,
      '123',
    ),
  ).toThrow('网盘内容不导入');
});
it('restricts the native bridge to fixed source routes and public HTTPS media files', () => {
  expect(native.pagePath({ action: 'search', query: '测试&wd=other' })).toBe(
    '/search/-------------.html?wd=' + encodeURIComponent('测试&wd=other'),
  );
  expect(() => native.pagePath({ action: 'resolve', url: 'file:///C:/secret' })).toThrow();
  expect(() => native.pagePath({ action: 'detail', id: '../../secret' })).toThrow();
  expect(native.mediaUrl('https://127.0.0.1/file.mp4')).toBeNull();
  expect(native.mediaUrl('https://public.example/file.mp4?temporary=token')).toContain(
    'public.example',
  );
  expect(native.mediaUrl('https://public.example/execute.js')).toBeNull();
});
