import type { DiscoveryPage } from './discovery';
export async function loadDiscovery(query: string, signal: AbortSignal): Promise<DiscoveryPage> {
  const res = await fetch(`/api/discover?${query}`, { signal });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '影片加载失败');
  return data;
}
