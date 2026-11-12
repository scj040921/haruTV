import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('./fetch-utils', () => ({ fetchUpstream: vi.fn(), getCache: vi.fn(), setCache: vi.fn() }));
import { fetchUpstream, getCache, setCache } from './fetch-utils';
import { fetchDiscovery } from './discovery-server';
import { parseDiscoveryFilters } from './discovery';
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getCache).mockReturnValue(undefined);
});
it('reports upstream authentication/rate-limit payloads as failures without caching an empty catalogue', async () => {
  vi.mocked(fetchUpstream).mockResolvedValue(
    new Response(JSON.stringify({ r: 1, msg: 'login required' })),
  );
  await expect(fetchDiscovery(parseDiscoveryFilters(new URLSearchParams()), 0, 24)).rejects.toThrow(
    '暂时不可用',
  );
  expect(setCache).not.toHaveBeenCalled();
});
it('enforces the requested score locally and terminates a sorted page below the cutoff', async () => {
  vi.mocked(fetchUpstream).mockResolvedValue(
    new Response(
      JSON.stringify({
        items: [
          { id: '1', title: 'good', rating: { value: 8.7 } },
          { id: '2', title: 'lower', rating: { value: 7.9 } },
          { id: '3', title: 'unrated', rating: null },
        ],
      }),
    ),
  );
  const page = await fetchDiscovery(
    parseDiscoveryFilters(new URLSearchParams('rating=8&sort=S')),
    0,
    30,
  );
  expect(page.items.map((i) => i.title)).toEqual(['good']);
  expect(page.nextStart).toBeNull();
});
it('coalesces simultaneous requests for the same shelf', async () => {
  let finish!: (r: Response) => void;
  vi.mocked(fetchUpstream).mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  const f = parseDiscoveryFilters(new URLSearchParams('genre=科幻'));
  const a = fetchDiscovery(f, 0, 18),
    b = fetchDiscovery(f, 0, 18);
  finish(new Response(JSON.stringify({ items: [{ id: '1', title: 'test' }] })));
  expect(await a).toEqual(await b);
  expect(fetchUpstream).toHaveBeenCalledTimes(1);
});
