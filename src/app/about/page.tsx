'use client';

import { Header } from '@/components/header';
import { SiteFooter } from '@/components/site-footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-10 space-y-8">
        <section>
          <h1 className="text-xl font-bold text-content mb-3">关于 haruTV</h1>
          <p className="text-sm text-muted leading-relaxed">
            haruTV 是你的私人桌面放映室。输入片名即可在多个点播源中聚合搜索，
            内置界面不插入广告；第三方视频本身可能包含广告。点播、直播和推荐均依赖第三方接口，字幕与画质以实际播放内容为准。
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-content mb-2.5">快捷键</h2>
          <ul className="text-sm text-muted space-y-1.5 list-disc list-inside">
            <li><code className="text-accent">空格</code> 播放 / 暂停</li>
            <li><code className="text-accent">←</code> / <code className="text-accent">→</code> 快退 / 快进 5 秒</li>
            <li><code className="text-accent">↑</code> / <code className="text-accent">↓</code> 音量调节</li>
            <li><code className="text-accent">F</code> 切换全屏</li>
            <li><code className="text-accent">Alt + ←/→</code> 上一集 / 下一集</li>
            <li><code className="text-accent">Ctrl + K</code> 聚焦全局搜索</li>
            <li><code className="text-accent">Ctrl + ,</code> 打开设置</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-content mb-2.5">隐私与数据</h2>
          <p className="text-sm text-muted leading-relaxed">
            搜索历史、观看进度、设置和缓存保存在本机应用数据目录。搜索关键词会发送至你启用的片源，视频和封面也会连接对应第三方服务。桌面代理在本机运行，不会隐藏你的公网 IP。下载和缓存功能可能在本机保存视频数据。
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-content mb-2.5">免责声明</h2>
          <p className="text-sm text-faint leading-relaxed">
            本项目不存储、不制作任何视频内容，仅提供第三方公开接口的聚合与播放能力。
            请尊重版权，所有内容的合法性由对应数据源负责。
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
