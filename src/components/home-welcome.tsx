"use client";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useAppStore } from "@/lib/store";
import { SmartImage } from "./smart-image";
export function HomeWelcome() {
  const selected = useAppStore((s) => s.selectedKeys);
  const mode = useAppStore((s) => s.imageProxyMode);
  const recent = useLiveQuery(() =>
    db.history.orderBy("timestamp").reverse().limit(4).toArray(),
  );
  return (
    <>
      {recent && recent.length > 0 && (
        <section className="haru-continue">
          <div className="haru-section-heading">
            <h2>继续观看</h2>
            <Link href="/library">全部记录 →</Link>
          </div>
          <div className="haru-continue-grid">
            {recent.map((h) => (
              <Link
                key={h.id}
                href={`/watch?source=${encodeURIComponent(h.sourceKey)}&id=${encodeURIComponent(h.vodId)}&index=${h.episodeIndex}&title=${encodeURIComponent(h.title)}`}
                className="haru-resume-card"
              >
                <div>
                  {h.pic && (
                    <SmartImage
                      url={h.pic}
                      mode={mode}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                  <span>▷</span>
                </div>
                <h3>{h.title}</h3>
                <small>
                  第 {h.episodeIndex + 1} 集 ·{" "}
                  {Math.floor(h.playbackPosition / 60)} 分钟
                </small>
                <progress value={h.playbackPosition} max={h.duration || 1} />
              </Link>
            ))}
          </div>
        </section>
      )}
      {selected.length === 0 && (
        <Link className="haru-onboarding" href="/settings">
          <span className="haru-onboarding-symbol">＋</span>
          <div>
            <h2>让放映室准备就绪</h2>
            <p>添加点播源或导入订阅，然后搜索你想看的故事。</p>
          </div>
          <span className="haru-onboarding-action">
            添加片源 <b>↗</b>
          </span>
        </Link>
      )}
    </>
  );
}
