/** Existing unknown CMS URLs keep their HLS handling; explicit files use native video. */
export function isProgressiveMedia(value: string): boolean {
  try {
    const u = new URL(value, 'http://harutv.local');
    const proxied = u.pathname === '/api/proxy' ? u.searchParams.get('url') : null;
    if (proxied && proxied !== value) return /\.(mp4|m4v|webm)(?:$|[?#])/i.test(proxied);
    return /\.(mp4|m4v|webm)$/i.test(u.pathname);
  } catch {
    return false;
  }
}
