"use client";
import { SourceManagerDrawer } from "@/components/source-manager";
import { useTheme } from "@/components/theme";
export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  return (
    <main className="haru-page">
      <p className="haru-eyebrow">MAKE IT YOURS</p>
      <h1>设置</h1>
      <p className="haru-page-description">按你的习惯，安排每一次放映。</p>
      <section className="haru-appearance">
        <div>
          <h2>外观</h2>
          <p>选择适合此刻的明暗</p>
        </div>
        <div role="group" aria-label="外观主题">
          {(["light", "dark", "system"] as const).map((t, i) => (
            <button
              key={t}
              aria-pressed={theme === t}
              onClick={() => setTheme(t)}
            >
              {["浅色", "深色", "跟随系统"][i]}
            </button>
          ))}
        </div>
      </section>
      <SourceManagerDrawer embedded open onClose={() => {}} />
    </main>
  );
}
