import Link from 'next/link';
export default function LicensesPage() {
  return (
    <main className="haru-page max-w-3xl space-y-8">
      <div>
        <p className="discovery-kicker">开源与致谢</p>
        <h1 className="text-3xl font-semibold">开源许可</h1>
      </div>
      <section className="space-y-3 text-sm leading-7">
        <h2 className="text-xl font-semibold">haruTV</h2>
        <p>本应用以 GNU AGPL-3.0-or-later 许可提供源代码。</p>
        <a
          className="text-accent"
          href="https://github.com/scj040921/haruTV"
          target="_blank"
          rel="noreferrer"
        >
          获取完整源代码与许可声明 ↗
        </a>
      </section>
      <section className="space-y-3 text-sm leading-7">
        <h2 className="text-xl font-semibold">第三方代码</h2>
        <p>
          包含修改后的 LibreSpark/LibreTV 2.22.0 代码（97f6ec4），原作者保留各自贡献的版权。haruTV
          是独立桌面衍生项目，桌面集成、品牌、界面与目录功能由 haruTV contributors
          修改。完整声明与原始项目说明随源代码提供。
        </p>
      </section>
      <section className="space-y-3 text-sm leading-7">
        <h2 className="text-xl font-semibold">目录与标识</h2>
        <p>
          目录事实包含 Wikidata（CC0）资料；部分海报资料来自 TVmaze（CC BY-SA 4.0）及豆瓣。厂牌 Logo
          用于识别对应专区，权利归各自所有者。收录信息不代表播放授权或与该厂牌存在合作关系。
        </p>
        <a
          className="text-accent"
          href="https://www.tvmaze.com/api"
          target="_blank"
          rel="noreferrer"
        >
          TVmaze 数据与许可 ↗
        </a>
      </section>
      <Link className="discovery-text-link" href="/about">
        返回关于 haruTV
      </Link>
    </main>
  );
}
