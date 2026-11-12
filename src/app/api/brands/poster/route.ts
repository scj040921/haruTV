import { NextResponse } from 'next/server';
import { guardRequest } from '@/lib/api-guard';
import { getBrandPoster } from '@/lib/brand-directory-server';
export const runtime = 'nodejs';
export async function GET(req: Request) {
  const guarded = guardRequest(req);
  if (guarded) return guarded;
  const p = new URL(req.url).searchParams;
  const cover = await getBrandPoster(p.get('brand') || '', p.get('id') || '');
  return cover
    ? NextResponse.redirect(new URL(`/api/proxy?url=${encodeURIComponent(cover)}`, req.url), {
        status: 307,
      })
    : new NextResponse(null, {
        status: 404,
        headers: { 'Cache-Control': 'private, max-age=1800' },
      });
}
