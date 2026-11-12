const { chromium } = require("playwright");
const fs = require("node:fs");
(async () => {
  const remote = await chromium.connectOverCDP("http://127.0.0.1:9333");
  const cookies = await remote.contexts()[0].cookies();
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1360, height: 900 },
  });
  await context.addCookies(cookies);
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  fs.mkdirSync("output/playwright", { recursive: true });
  await page.goto("http://127.0.0.1:17834/");
  await page.getByRole("heading", { name: /让好故事/ }).waitFor();
  await page.screenshot({ path: "output/playwright/harutv-home.png" });
  await page.keyboard.press("Control+k");
  if (
    await page
      .getByRole("textbox", { name: "全局搜索影片" })
      .evaluate((el) => el !== document.activeElement)
  )
    throw Error("Search shortcut failed");
  await page.getByRole("textbox", { name: "全局搜索影片" }).fill("测试影片");
  await page.keyboard.press("Enter");
  await page.getByRole("heading", { name: "搜索影片", exact: true }).waitFor();
  await page.getByRole("link", { name: "设置 Ctrl ," }).click();
  await page.getByRole("heading", { name: "设置", exact: true }).waitFor();
  if (await page.evaluate(() => document.body.style.overflow === "hidden"))
    throw Error("Settings incorrectly locks scrolling");
  await page.getByRole("button", { name: "深色", exact: true }).click();
  if (
    !(await page
      .locator("html")
      .evaluate((el) => el.classList.contains("dark")))
  )
    throw Error("Theme failed");
  await page.waitForTimeout(350);
  await page.screenshot({ path: "output/playwright/harutv-settings-dark.png" });
  await page.getByRole("tab", { name: "偏好设置", exact: true }).click();
  await page.getByRole("tab", { name: "播放与过滤" }).waitFor();
  await page.getByRole("tab", { name: "数据", exact: true }).click();
  await page.getByRole("heading", { name: "配置导入导出" }).waitFor();
  await page.getByRole("link", { name: "观看记录", exact: true }).click();
  await page.getByRole("heading", { name: "故事，从这里开始" }).waitFor();
  await page.screenshot({ path: "output/playwright/harutv-library-dark.png" });
  await page.getByRole("link", { name: "电视直播", exact: true }).click();
  await page.getByRole("main").waitFor();
  await page.screenshot({ path: "output/playwright/harutv-live-dark.png" });
  await page.getByRole("button", { name: "下载管理", exact: true }).click();
  await page.getByRole("heading", { name: "下载管理", exact: true }).waitFor();
  await page.screenshot({ path: "output/playwright/harutv-downloads.png" });
  await page.keyboard.press("Escape");
  await page.goto("http://127.0.0.1:17834/");
  await page.screenshot({ path: "output/playwright/harutv-home-dark.png" });
  await page.setViewportSize({ width: 960, height: 640 });
  await page.screenshot({ path: "output/playwright/harutv-compact.png" });
  if (
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  )
    throw Error("Horizontal overflow");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.screenshot({
    path: "output/playwright/harutv-reduced-motion.png",
  });
  if (errors.length) throw Error(errors.join("\n"));
  console.log(
    "PASS: navigation, search shortcut, empty search, embedded settings, theme, preferences, data, history, live, downloads, compact layout, reduced motion; no renderer exceptions.",
  );
  await browser.close();
  process.exit(0);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
