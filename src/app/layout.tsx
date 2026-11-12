import type { Metadata, Viewport } from 'next';
import './globals.css';
import './haru.css';
import './discovery.css';
import { DesktopShell } from '@/components/desktop-shell';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: { default: 'haruTV', template: '%s · haruTV' },
  description: '留一点时间，给好故事。你的私人桌面放映室。',
  icons: { icon: '/harutv.svg' },
};

export const viewport: Viewport = {
  themeColor: '#171a19',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* 首屏前同步主题，避免亮暗闪烁 */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('harutv-theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})()",
          }}
        />
      </head>
      <body>
        <Providers><DesktopShell>{children}</DesktopShell></Providers>
      </body>
    </html>
  );
}
