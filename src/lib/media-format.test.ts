import { expect, it } from 'vitest';
import { isProgressiveMedia } from './media-format';
it('routes native MP4/WebM files separately from HLS, including query strings and local proxy URLs', () => {
  expect(isProgressiveMedia('https://cdn.example/movie.mp4?token=example')).toBe(true);
  expect(isProgressiveMedia('https://cdn.example/movie.MP4')).toBe(true);
  expect(isProgressiveMedia('https://cdn.example/movie.webm')).toBe(true);
  expect(
    isProgressiveMedia(
      '/api/proxy?url=' + encodeURIComponent('https://cdn.example/movie.mp4?token=example'),
    ),
  ).toBe(true);
  expect(isProgressiveMedia('https://cdn.example/master.m3u8')).toBe(false);
  expect(isProgressiveMedia('https://cdn.example/player.php?id=1')).toBe(false);
  expect(isProgressiveMedia('https://www.libvio.in/w/123-3-1.html')).toBe(false);
});
