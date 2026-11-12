# haruTV

haruTV Windows 桌面应用，使用 AGPL-3.0-or-later。代码与第三方归属见 NOTICE.md。

## 开发

Node.js 22 LTS 或更新版本。`npm ci` 安装依赖。

- `npm run build:desktop`：构建本地服务与前端。
- `npm run desktop`：运行 Electron 桌面应用。
- `npm run build:win`：生成 Windows NSIS 安装包。
- `npm run dev`：前端调试服务（8080），需自行在 .env.local 设置 PASSWORD。
- `npm run typecheck` / `npm test` / `npm run lint`：验证。

## 应用结构

`desktop/` 管理窗口、自动本地认证和进程生命周期。服务仅监听 127.0.0.1:17834。桌面凭证自动生成于 Electron userData/desktop.json，不进入安装包。窗口大小存于 window.json。
`src/components/desktop-shell.tsx` 提供常驻导航和受限窗口控制桥接。
`src/app/haru.css` 定义 haruTV 的语义配色、布局与减少动态效果支持。
`/library` 展示真实观看记录，`/settings` 提供外观、源管理、偏好和配置导入导出。
搜索聚合、片源健康检查、HLS/直播、进度存储、缓存和下载继续使用上游核心。

预置源与抽样检测结果见 [SOURCES.md](SOURCES.md)，可在设置中关闭或补充。推荐内容来自第三方，网络不可用时显示原有错误与重试状态。

## HIG 取舍

借鉴内容优先、层级、侧栏导航、系统外观、焦点与一致交互原则；Windows 使用本平台的窗口操作位置。侧栏和工具栏承载导航，主要内容保持清晰，设置用渐进分组呈现。首页以实际影片海报、明确标题和可操作的分类入口呈现内容。动画和横向滚动尊重 prefers-reduced-motion。

参考：https://developer.apple.com/design/human-interface-guidelines/sidebars 、https://developer.apple.com/design/human-interface-guidelines/layout 。

Windows 安装包为本地开发预览，未签名；当前没有应用自动更新通道。版本信息以本项目发布为准。

图片中的 23 条可见点播配置已按用户要求导入本机应用（新增 22 条、1 条重复跳过），完整清单见 sources/image-2026-11-13.json。网盘方案已按用户决定取消，当前构建无网盘入口和凭证读取代码。

## 0.3.0 内容发现

- 首页提供 8 组可横向浏览的推荐，每组最多 18 部：热门电影、剧集、高分电影、科幻、悬疑、动漫、综艺和纪录片。继续观看沿用真实本地记录。原有推荐频道作为附加栏目保留。
- `/browse` 由 URL 保存内容类型、25 种题材、16 个地区、6 个年代、最低评分与排序，支持返回恢复和逐页加载。上游实际支持年代标签；忽略的 year_range / score_range 参数没有被用作筛选依据。最低评分由服务端核验。
- `/brands` 提供 Netflix、HBO、Apple TV+、BBC、A24、吉卜力、皮克斯、漫威影业 8 个专区，54 部经过标题、年份与归属核对的精选作品，支持专区内搜索、类型、题材和排序。它是人工精选目录，不是品牌完整内容库。
- 厂牌入口均使用真实 Logo。本地原始素材及来源记录位于 `public/brands/`，其中 A24、皮克斯取自其官方网站，其余来自 Wikimedia Commons 的品牌标识文件。保留原有几何比例；浅深主题均使用独立可读背景。
- 推荐与分类通过固定目标 `/api/discover` 请求豆瓣公开影片元数据，30 分钟缓存与同请求合并，不读取账户数据、不调用登录接口。厂牌片单为本地事实元数据快照，不依赖实时推荐服务。
- 元数据只用于发现影片；点击海报仍进入原有片源搜索与播放流程，不把元数据、平台品牌或海报当作播放授权、4K 或 HDR 的证明。

元数据映射在 `src/lib/discovery.ts`，服务端请求在 `src/lib/discovery-server.ts`，精选片单位于 `src/lib/catalog/brands.json`，专用界面样式在 `src/app/discovery.css`。远程推荐失败有重试状态，片单筛选为空可以清除筛选；翻页失败保留已经显示的影片。

## 0.4.0 厂牌作品目录

厂牌页面改用独立服务端目录，搜索作用于整个目录，按 24 条翻页，支持类型、题材、年份和排序。目录记录来自公开出品、发行或原创首播关系，不包含单集/季作为独立作品。并非完整或实时的所有权数据库；数量、更新时间、元数据缺失均在界面说明。目录与元数据许可见 DATA-LICENSE.md。缺失的海报按需查询公开影片资料或通过精确 IMDb 标识查询 TVmaze，访问限制触发暂停，不切换身份重试。

当前 0.4.0 快照共 4,607 条品牌目录记录：Netflix 1,725、HBO 522、Apple TV+ 161、BBC 1,810、A24 176、吉卜力 48、皮克斯 93、漫威影业 72。记录可能跨厂牌重复，数量不是可播放视频数量。维护更新脚本：`python scripts/refresh-brand-directory.py --write`。
