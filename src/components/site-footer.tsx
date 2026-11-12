import Link from 'next/link';
export function SiteFooter() {
  return (
    <footer className="haru-footer">
      <span>haruTV · 留一点时间，给好故事</span>
      <Link href="/licenses">开源许可与致谢</Link>
    </footer>
  );
}
