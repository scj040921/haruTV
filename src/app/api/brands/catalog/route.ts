import { NextResponse } from 'next/server';
import { guardRequest } from '@/lib/api-guard';
import { parseBrandFilters } from '@/lib/brand-directory';
import { getBrandDirectory } from '@/lib/brand-directory-server';
export const runtime = 'nodejs';
export async function GET(req: Request) {
  const guarded = guardRequest(req);
  if (guarded) return guarded;
  const p = new URL(req.url).searchParams;
  const page = getBrandDirectory(p.get('brand') || '', parseBrandFilters(p));
  return page
    ? NextResponse.json(page)
    : NextResponse.json({ error: '找不到这个厂牌' }, { status: 404 });
}
