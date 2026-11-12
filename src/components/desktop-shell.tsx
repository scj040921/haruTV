"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "./icon";
import { ThemeToggle } from "./theme";
import { requestShowDownloadManager } from "./download-manager";
import { useAppStore } from "@/lib/store";

declare global {
  interface Window {
    haruDesktop?: {
      platform: string;
      minimize: () => void;
      maximize: () => void;
      close: () => void;
    };
  }
}
const items: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "现在观看", icon: "home" },
  { href: "/browse", label: "分类浏览", icon: "filter" },
  { href: "/brands", label: "厂牌专区", icon: "collection" },
  { href: "/live", label: "电视直播", icon: "bolt" },
  { href: "/library", label: "观看记录", icon: "clock" },
];
export function DesktopShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const search = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [desktop, setDesktop] = useState(false);
  const count = useAppStore((s) => s.selectedKeys.length);
  useEffect(() => {
    setDesktop(Boolean(window.haruDesktop));
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        search.current?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === ",") {
        e.preventDefault();
        router.push("/settings");
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [router]);
  const title =
    pathname === "/licenses" ? "开源许可" : pathname === "/browse" ? "分类浏览" : pathname === "/brands" ? "厂牌专区" : pathname === "/live"
      ? "电视直播"
      : pathname === "/library"
        ? "观看记录"
        : pathname === "/settings"
          ? "设置"
          : pathname === "/about"
            ? "关于 haruTV"
            : pathname === "/watch"
              ? "放映中"
              : "现在观看";
  return (
    <div className="haru-app">
      <aside className="haru-sidebar">
        <Link href="/" className="haru-brand">
          <Image src="/harutv.svg" alt="" width="38" height="38" />
          <span>
            haru<span className="haru-brand-tv">TV</span>
            <small>你的私人放映室</small>
          </span>
        </Link>
        <p className="haru-nav-label">发现</p>
        <nav aria-label="主导航">
          {items.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className={
                pathname === i.href ? "haru-nav-item selected" : "haru-nav-item"
              }
              aria-current={pathname === i.href ? "page" : undefined}
              title={i.label}
            >
              <Icon name={i.icon} />
              <span>{i.label}</span>
              {pathname === i.href && <span className="haru-nav-dot" />}
            </Link>
          ))}
        </nav>
        <p className="haru-nav-label">资料库</p>
        <button className="haru-nav-item" onClick={requestShowDownloadManager}>
          <Icon name="download" />
          <span>下载管理</span>
        </button>
        <div className="haru-sidebar-bottom">
          <Link href="/settings" className="haru-source-status">
            <span className={count ? "status-dot online" : "status-dot"} />
            <div>
              {count ? `${count} 个已选片源` : "添加你的第一个片源"}
              <small>
                {count ? "已准备好探索更多故事" : "连接内容，开启放映"}
              </small>
            </div>
            <span>›</span>
          </Link>
          <Link
            href="/settings"
            aria-current={pathname === "/settings" ? "page" : undefined}
            className={
              "haru-nav-item " + (pathname === "/settings" ? "selected" : "")
            }
          >
            <Icon name="gear" />
            <span>设置</span>
            <kbd>Ctrl ,</kbd>
          </Link>
          <Link href="/about" className="haru-nav-item">
            <Icon name="alert" />
            <span>关于 haruTV</span>
            <small>{process.env.APP_VERSION}</small>
          </Link>
        </div>
      </aside>
      <div className="haru-main">
        <header className={"haru-toolbar " + (desktop ? "desktop" : "")}>
          <div className="haru-toolbar-title">
            <button
              aria-label="返回"
              title="返回"
              onClick={() => router.back()}
            >
              ‹
            </button>
            <span>{title}</span>
          </div>
          <form
            className="haru-toolbar-search"
            onSubmit={(e) => {
              e.preventDefault();
              if (query.trim())
                router.push(
                  "/?s=" + encodeURIComponent(query.trim().slice(0, 100)),
                );
            }}
          >
            <Icon name="search" />
            <input
              ref={search}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索影片"
              aria-label="全局搜索影片"
            />
            <kbd>Ctrl K</kbd>
          </form>
          <ThemeToggle />
          {desktop && (
            <div className="haru-window-actions">
              <button
                aria-label="最小化"
                onClick={() => window.haruDesktop?.minimize()}
              >
                −
              </button>
              <button
                aria-label="最大化或还原"
                onClick={() => window.haruDesktop?.maximize()}
              >
                □
              </button>
              <button
                aria-label="关闭窗口"
                onClick={() => window.haruDesktop?.close()}
              >
                ×
              </button>
            </div>
          )}
        </header>
        <div
          className={
            "haru-content " + (pathname === "/watch" ? "haru-watching" : "")
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
}
