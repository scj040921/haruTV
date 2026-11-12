# haruTV 片源抽样检测

检测日期：2026-11-13（Asia/Shanghai）。公开 GitHub 配置仅提供接口线索；分辨率和音轨来自本机 FFprobe 实测，中文字幕来自截帧人工检查。只代表所测样本和检测时刻，不能推断整站影片均具有同等画质或字幕。

## 已接入

| 来源 | 样本 | 实测分辨率 | 音频 | 中文字幕证据 |
| --- | --- | --- | --- | --- |
| 魔都资源 | 一部英文电影 | 1920×1080，H.264 | AAC 2.0，44.1kHz | 已在画面确认中英双语硬字幕 |
| 非凡资源 | 同一部英文电影 | 1920×808，H.264 | AAC 2.0，44.1kHz | 已在画面确认中英双语硬字幕 |
| 河北卫视 4K | 当前直播 | 3840×2160，H.264 | AAC 2.0，48kHz | 随节目变化，不保证所有节目有字幕 |
| 湖南卫视 4K | 当前直播 | 3840×2160，HEVC | AAC 2.0，48kHz | 随节目变化；HEVC 需设备支持 |
| 苏州 4K | 当前直播 | 3840×2160，H.264 | AAC 2.0，48kHz | 随节目变化，不保证所有节目有字幕 |

两条点播接口未测到 4K，也未测到 Dolby Atmos、DTS 或多声道。不将它们标成 4K。直播的 3840×2160 表示传输尺寸，不证明所有播出内容均为原生 4K 拍摄。

数据文件：[desktop/source-presets.json](desktop/source-presets.json)。桌面主进程下发给原有环境预置源机制，用户的手动源、观看记录和个人偏好保留。

## GitHub 线索

- [haojun19980728-prog/libretv-source-list](https://github.com/haojun19980728-prog/libretv-source-list/blob/main/libretv-sources.json)：包含魔都等公开 Apple CMS 接口。
- [erxuw196/libretv-sources](https://github.com/erxuw196/libretv-sources/blob/main/libretv-sources.json)：包含非凡等公开接口。
- [4K 直播播放列表](https://gist.github.com/yifanwang-yet/c2c9263066c0c5d20f50ce9b31d40e7e)：本版本接入的三条 4K 直播。
- [iptv-org 中国列表](https://github.com/iptv-org/iptv/blob/master/streams/cn.m3u)：交叉核对河北、湖南源。
- [qist/tvbox 配置](https://github.com/qist/tvbox/blob/master/dianshi.json)：大量 4K 点播项为 Spider / 网盘适配器，当前内核无法直接导入，也未将它们冒充可用 API。

## 未选用的抽样候选

暴风样本为 1920×808；量子为 1080×606；360 为 720×406；优酷样本媒体端返回 5xx；无尽和索尼接口返回 403；爱坤 DNS 失败；部分候选超时。接口可搜索与媒体可播放是两项独立检查。

原始检测和字幕截帧仅保留在本机 output/source-audit/，不进入安装包。公开配置不等于内容使用授权。第三方接口可能变化或失效，可在设置停用或移除。

## 用户提供的 TVBox 地址复核（2026-11-13）

重复内容去重后为 25 个完整地址，江雅地址被截断，无法请求。以下是当前网络和检测时刻的结果，超时及 DNS 失败不表示永久失效。可解析数量不等于所有媒体均可播放。

| 名称 | 地址 | 当前结果 |
| --- | --- | --- |
| 饭太硬 | http://www.饭太硬.com/tv | 本次请求超时 |
| 肥猫新接口 | http://肥猫.com/ | 本次请求超时 |
| 肥猫新备用 | http://like.肥猫.com/你好 | 本次请求超时 |
| 肥猫原接口 | http://肥猫.live | 返回网页或非 JSON，无法直接导入 |
| 肥猫原备用 | http://我不是.肥猫.live/接口禁止贩卖 | HTTP 404 |
| 荷城茶秀 | http://rihou.cc:88/荷城茶秀 | DNS 解析失败 |
| iitvba | http://tt.iitvba.com/vip/tv.json | DNS 解析失败 |
| 星辰 | http://8.210.232.168/xc.json | 本次请求超时 |
| 茄子库 | http://tv.奥利给.top | DNS 解析失败 |
| 运输车 | https://weixine.net/ysc.json | 返回网页或非 JSON，无法直接导入 |
| 小盒子 | http://xhztv.top/xhz | 配置中没有可直接导入的源：已跳过 55 个条目（Spider 引擎 54、非 M3U 直播 1） |
| 小盒子4K | http://xhztv.top/4k.json | 可解析 9 个点播源、0 个直播列表；46 项不兼容 |
| 摸鱼4K | http://我不是.摸鱼儿.top | 本次请求超时 |
| 爱TV吧gitmirror | https://hub.gitmirror.com/https://raw.githubusercontent.com/txtvv/txtv/main/tvbox/0326.json | DNS 解析失败 |
| 爱TV吧ghproxy | https://mirror.ghproxy.com/https://raw.githubusercontent.com/txtvv/txtv/main/tvbox/0326.json | 本次请求超时 |
| 云星日记 | http://itvbox.cc/云星日记 | 本次请求超时 |
| 巧记 | http://cdn.qiaoji8.com/tvbox.json | DNS 解析失败 |
| 失眠的夜 | http://清清.摸鱼儿.top | 本次请求超时 |
| 俊佬 | http://home.jundie.top:81/top98.json | 配置中没有可直接导入的源：已跳过 26 个条目（Spider 引擎 24、非 M3U 直播 1、地址不可用 1） |
| 喵影视 | http://meowtv.top/tv | DNS 解析失败 |
| 骚零 | https://100km.top/0 | DNS 解析失败 |
| 道长 | https://pastebin.com/raw/5NHaxyGR | HTTP 404 |
| 小马影视 | https://szyyds.cn/tv/x.json | 可解析 15 个点播源、6 个直播列表；51 项不兼容 |
| dxawi0 | https://xhdwc.tk/0 | DNS 解析失败 |
| 刘备 | https://raw.liucn.cc/box/m.json | 可解析 14 个点播源、0 个直播列表；222 项不兼容 |

4K 专项：小胡 4K 的 API 域名本次 DNS 解析失败；玩偶类 4K 线路需要网盘授权及分享转存；Mp4Mov / SeedHub / SixV 属于磁力或 Spider；刘备配置的 4K 剧院扩展规则返回 404；蓝光影院域名本次 DNS 解析失败。没有将这些条目伪装成已验证的 4K 点播源。

来源配置中带有 `?ac=list` 的 API 触发了上游直接拼接第二个问号的问题。现已统一用 URLSearchParams 构造搜索、详情、测速和画质请求，保留原有访问参数，补充 3 项回归测试。
