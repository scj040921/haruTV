import data from './catalog/brands.json';
import directory from './catalog/directory-summary.json';
import type { DiscoveryItem } from './discovery';
export const BRANDS = data.brands.map((brand) => ({
  ...brand,
  total: (directory.counts as Record<string, number>)[brand.id] || brand.items.length,
  logo: `/brands/${brand.id}.${brand.id === 'pixar' ? 'png' : 'svg'}`,
  items: brand.items as DiscoveryItem[],
}));
export const BRAND_CATALOG_DATE = directory.updatedAt;
