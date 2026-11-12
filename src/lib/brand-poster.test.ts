import { expect, it, vi } from 'vitest';
vi.mock('./fetch-utils', () => ({ fetchUpstream: vi.fn(), getCache: vi.fn(), setCache: vi.fn() }));
import { fetchUpstream } from './fetch-utils';
import data from './catalog/directory.json';
import { getBrandPoster } from './brand-directory-server';

it('recognizes the subject provider IP restriction carried in an HTTP 400 body and stops probing', async () => {
  const candidates = data.brands.ghibli.filter((i) => !i.cover && i.doubanId && i.kind === 'movie');
  expect(candidates.length).toBeGreaterThan(1);
  vi.mocked(fetchUpstream).mockResolvedValue(
    new Response(JSON.stringify({ code: 1309, msg: 'subject_ip_rate_limit' }), { status: 400 }),
  );
  expect(await getBrandPoster('ghibli', candidates[0].id)).toBeNull();
  expect(await getBrandPoster('ghibli', candidates[1].id)).toBeNull();
  expect(fetchUpstream).toHaveBeenCalledTimes(1);
});
