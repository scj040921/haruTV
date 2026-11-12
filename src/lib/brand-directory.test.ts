import { expect, it } from 'vitest';
import { parseBrandFilters, searchBrandWorks, type BrandWork } from './brand-directory';
import { getBrandDirectory } from './brand-directory-server';

const works: BrandWork[] = Array.from({ length: 55 }, (_, n) => ({
  id: `Q${n}`,
  title: `作品${n}`,
  originalTitle: `Film ${n}`,
  cover: '',
  rating: n % 10,
  year: n < 40 ? '2020' : '2024',
  kind: n % 2 ? 'tv' : 'movie',
  genres: n % 3 ? ['剧情'] : ['科幻'],
  countries: [],
  subtitle: '',
  sourceUrl: '',
  doubanId: '',
  imdbId: '',
}));
it('searches the entire directory, including records beyond the displayed page, by Chinese or original title', () => {
  expect(
    searchBrandWorks(works, parseBrandFilters(new URLSearchParams('q=Film 54'))).items[0].id,
  ).toBe('Q54');
  expect(searchBrandWorks(works, parseBrandFilters(new URLSearchParams('q=作品54'))).total).toBe(1);
});
it('paginates distinct records and only stops at the actual filtered end', () => {
  const pages = [1, 2, 3].map((page) =>
    searchBrandWorks(works, parseBrandFilters(new URLSearchParams({ page: String(page) }))),
  );
  expect(pages.map((p) => p.items.length)).toEqual([24, 24, 7]);
  expect(pages.map((p) => p.nextPage)).toEqual([2, 3, null]);
  expect(new Set(pages.flatMap((p) => p.items.map((i) => i.id))).size).toBe(55);
});
it('combines filters before pagination and does not reorder the source snapshot', () => {
  const first = works[0].id;
  const filtered = searchBrandWorks(
    works,
    parseBrandFilters(new URLSearchParams('kind=tv&year=2024&genre=科幻&sort=rating')),
  );
  expect(filtered.items.length).toBeGreaterThan(0);
  expect(
    filtered.items.every((i) => i.kind === 'tv' && i.year === '2024' && i.genres.includes('科幻')),
  ).toBe(true);
  expect(filtered.items.map((i) => i.rating)).toEqual(
    filtered.items.map((i) => i.rating).sort((a, b) => b! - a!),
  );
  expect(works[0].id).toBe(first);
});
it('limits invalid query values and treats prototype keys as unknown brands', () => {
  const filters = parseBrandFilters(
    new URLSearchParams('page=-100&kind=other&sort=unknown&year=oops'),
  );
  expect(filters.page).toBe(1);
  expect(filters.kind).toBe('');
  expect(filters.year).toBe('');
  expect(getBrandDirectory('__proto__', filters)).toBeNull();
});
it('opens the extended catalogue rather than the old small curated collection', () => {
  const page = getBrandDirectory('netflix', parseBrandFilters(new URLSearchParams()))!;
  expect(page.catalogueTotal).toBeGreaterThan(500);
  expect(page.items).toHaveLength(24);
  expect(page.nextPage).toBe(2);
  expect(
    getBrandDirectory('ghibli', parseBrandFilters(new URLSearchParams()))!.catalogueTotal,
  ).toBeGreaterThan(20);
});
