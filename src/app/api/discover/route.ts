import { NextResponse } from 'next/server';
import { guardRequest } from '@/lib/api-guard';
import { parseDiscoveryFilters } from '@/lib/discovery';
import { fetchDiscovery } from '@/lib/discovery-server';
export const runtime = 'nodejs';
export async function GET(req: Request) {
  const guarded = guardRequest(req);
  if (guarded) return guarded;
  const p = new URL(req.url).searchParams;
  const start = Math.min(5000, Math.max(0, Math.floor(Number(p.get('start')) || 0)));
  const count = Math.min(30, Math.max(1, Math.floor(Number(p.get('count')) || 24)));
  try {
    return NextResponse.json(await fetchDiscovery(parseDiscoveryFilters(p), start, count));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '推荐内容加载失败' },
      { status: 502 },
    );
  }
}
