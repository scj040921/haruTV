"use client";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { db, removeHistory } from "@/lib/db";
import { useAppStore } from "@/lib/store";
import { SmartImage } from "@/components/smart-image";
import { Icon } from "@/components/icon";
export default function LibraryPage() {
  const history = useLiveQuery(() =>
    db.history.orderBy("timestamp").reverse().toArray(),
  );
  const [query, setQuery] = useState("");
  const mode = useAppStore((s) => s.imageProxyMode);
  const rows = history?.filter((h) =>
    h.title.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <main className="haru-page">
      <p className="haru-eyebrow">PICK UP WHERE YOU LEFT OFF</p>
      <h1>观看记录</h1>
      <p className="haru-page-description">
        每个故事，都可以从上次停下的地方继续。
      </p>
      <div className="haru-library-toolbar">
        <span>{history?.length ?? 0} 部影片</span>
        <input
          className="input"
          aria-label="筛选观看记录"
          placeholder="查找观看记录"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {history === undefined ? (
        <p role="status">正在读取观看记录…</p>
      ) : rows?.length === 0 ? (
        <div className="haru-empty">
          <Icon name="clock" className="w-10 h-10" />
          <h2>{query ? "没有匹配的记录" : "故事，从这里开始"}</h2>
          <p>
            {query
              ? "换一个关键词试试。"
              : "看过的影片和播放进度会保存在这里。"}
          </p>
          <Link href="/" className="btn-primary">
            去探索影片
          </Link>
        </div>
      ) : (
        <div className="haru-library-grid">
          {rows?.map((h) => (
            <article className="haru-library-card" key={h.id}>
              <Link
                href={`/watch?source=${encodeURIComponent(h.sourceKey)}&id=${encodeURIComponent(h.vodId)}&index=${h.episodeIndex}&title=${encodeURIComponent(h.title)}`}
              >
                <div className="haru-library-poster">
                  {h.pic ? (
                    <SmartImage
                      url={h.pic}
                      mode={mode}
                      alt={h.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Icon name="home" className="w-10 h-10" />
                  )}
                  <span className="haru-resume-label">▷ 继续观看</span>
                </div>
                <h2>{h.title}</h2>
                <p>
                  第 {h.episodeIndex + 1} 集 · 已观看{" "}
                  {Math.floor(h.playbackPosition / 60)} 分钟
                </p>
                <progress value={h.playbackPosition} max={h.duration || 1} />
              </Link>
              <button
                className="haru-remove"
                title="移除此记录"
                aria-label={`移除${h.title}的观看记录`}
                onClick={() => void removeHistory(h.sourceKey, h.vodId)}
              >
                <Icon name="close" className="w-4 h-4" />
              </button>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
