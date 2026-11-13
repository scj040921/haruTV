const ORIGIN = 'https://www.libvio.in';
function fullscreenAllowed(permission, url) {
  try {
    return permission === 'fullscreen' && new URL(url).origin === ORIGIN;
  } catch {
    return false;
  }
}
function pagePath(request) {
  if (!request || typeof request !== 'object') throw new Error('无效的 LIBVIO 请求');
  if (request.action === 'search')
    return (
      '/search/-------------.html?wd=' +
      encodeURIComponent(String(request.query || '').slice(0, 100))
    );
  if (request.action === 'detail' && /^\d{1,15}(?:-\d{1,3})?$/.test(request.id || ''))
    return '/detail/' + request.id.split('-')[0] + '.html';
  if (request.action === 'test' || request.action === 'verify') return '/';
  if (request.action === 'resolve' || request.action === 'page') {
    const u = new URL(String(request.url));
    if (
      u.origin === ORIGIN &&
      /^\/w\/\d{1,15}-\d{1,3}-\d{1,5}\.html$/.test(u.pathname) &&
      !u.search &&
      !u.hash
    )
      return u.pathname;
  }
  throw new Error('LIBVIO 地址或操作不受支持');
}
function mediaUrl(value) {
  try {
    const u = new URL(value);
    if (
      u.protocol !== 'https:' ||
      u.username ||
      u.password ||
      u.port ||
      !/\.(mp4|m3u8)(?:$|\?)/i.test(u.pathname)
    )
      return null;
    if (
      /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|\[|172\.(1[6-9]|2\d|3[01])\.)/i.test(
        u.hostname,
      )
    )
      return null;
    return u.href;
  } catch {
    return null;
  }
}
function createLibvio() {
  const { BrowserWindow, WebContentsView, session } = require('electron');
  let worker,
    serial = Promise.resolve(),
    lastMedia = '';
  const cache = new Map();
  let view,
    viewParent,
    viewUrl = '',
    visibleBounds,
    started = false;
  let siteFullscreen = false;
  const partition = 'persist:harutv-libvio';
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  function getWorker() {
    if (worker && !worker.isDestroyed()) return worker;
    const sess = session.fromPartition(partition);
    sess.setPermissionRequestHandler((wc, permission, callback, details) =>
      callback(
        wc === view?.webContents && fullscreenAllowed(permission, details.requestingUrl),
      ),
    );
    sess.setPermissionCheckHandler((wc, permission, origin, details) =>
      wc === view?.webContents &&
      fullscreenAllowed(permission, details.requestingUrl || origin),
    );
    // The helper discovers the normal player's URL, but never downloads or plays
    // the movie in a hidden window. Playback occurs only in the user's player.
    sess.webRequest.onBeforeRequest(
      { urls: ['http://*/*', 'https://*/*'] },
      (details, callback) => {
        if (
          details.resourceType === 'media' &&
          worker &&
          !worker.isDestroyed() &&
          details.webContentsId === worker.webContents.id
        ) {
          lastMedia = mediaUrl(details.url) || lastMedia;
          callback({ cancel: true });
        } else callback({ cancel: false });
      },
    );
    worker = new BrowserWindow({
      width: 1040,
      height: 760,
      show: false,
      title: 'LIBVIO 网站验证',
      webPreferences: {
        partition,
        sandbox: true,
        nodeIntegration: false,
        contextIsolation: true,
        backgroundThrottling: false,
      },
    });
    worker.webContents.setAudioMuted(true);
    worker.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    worker.webContents.on('will-navigate', (event, url) => {
      if (new URL(url).origin !== ORIGIN) event.preventDefault();
    });
    return worker;
  }
  async function navigate(path, show = false) {
    const w = getWorker();
    lastMedia = '';
    if (show) w.show();
    const loading = w.loadURL(ORIGIN + path).catch(() => {});
    void loading;
    for (let i = 0; i < 150; i++) {
      if (w.isDestroyed()) throw new Error('LIBVIO 验证窗口已关闭');
      const state = await w.webContents
        .executeJavaScript(
          `({ ready: /LIBVIO/i.test(document.title) && !/验证|verifying|challenge/i.test(document.title) && !!document.querySelector('.stui-vodlist,.vod-hero,.stui-player__detail,.stui-header__top'), html: document.documentElement.outerHTML })`,
        )
        .catch(() => null);
      if (state?.ready) {
        if (!show) w.hide();
        return state.html.slice(0, 2_000_000);
      }
      // Only the site itself runs its normal automatic verification. Never click,
      // solve or patch a challenge; show the official window if user action is needed.
      if (i === 40) w.show();
      await sleep(300);
    }
    throw new Error('LIBVIO 仍需要网站验证，请在官方验证窗口完成后重试');
  }
  async function html(path) {
    const old = cache.get(path);
    if (old && Date.now() - old.time < 120_000) return old.html;
    const w = getWorker();
    let text;
    if (w.webContents.getURL().startsWith(ORIGIN + '/')) {
      const response = await w.webContents
        .executeJavaScript(
          `fetch(${JSON.stringify(path)}, { credentials: 'include' }).then(async r => ({ status: r.status, html: await r.text() }))`,
        )
        .catch(() => null);
      if (
        response?.status === 200 &&
        /LIBVIO/i.test(response.html) &&
        !/正在验证您的浏览器/.test(response.html)
      )
        text = response.html;
    }
    if (!text) text = await navigate(path);
    cache.set(path, { html: text, time: Date.now() });
    return text.slice(0, 2_000_000);
  }
  async function resolve(path) {
    await navigate(path);
    const w = getWorker();
    for (let i = 0; i < 50; i++) {
      for (const frame of [w.webContents.mainFrame, ...w.webContents.mainFrame.frames]) {
        if (!frame.url.startsWith(ORIGIN + '/')) continue;
        const src = await frame
          .executeJavaScript(
            `document.querySelector('video')?.currentSrc || document.querySelector('video')?.src || ''`,
          )
          .catch(() => '');
        const found = mediaUrl(src);
        if (found) return { url: found };
      }
      if (lastMedia) return { url: lastMedia };
      await sleep(250);
    }
    throw new Error('这个 LIBVIO 播放线路暂未提供可直接播放的视频地址，请切换线路或在官网播放');
  }
  function closeView() {
    if (view) {
      if (viewParent && !viewParent.isDestroyed()) viewParent.contentView.removeChildView(view);
      if (!view.webContents.isDestroyed()) view.webContents.close();
    }
    view = null;
    viewUrl = '';
    started = false;
    if (siteFullscreen && viewParent && !viewParent.isDestroyed()) viewParent.setFullScreen(false);
    siteFullscreen = false;
  }
  function position(parent, input) {
    if (!view || !input) return;
    if (siteFullscreen) {
      const [width, height] = parent.getContentSize();
      view.setBounds({ x: 0, y: 0, width, height });
      view.setVisible(true);
      return;
    }
    const size = parent.getContentBounds();
    const zoom = parent.webContents.getZoomFactor();
    const values = ['x', 'y', 'width', 'height'].map((k) => Number(input[k]) * zoom);
    if (!values.every(Number.isFinite)) throw new Error('无效的播放器位置');
    const [x, y, width, height] = values;
    const clipped = {
      x: Math.max(0, Math.round(x)),
      y: Math.max(0, Math.round(y)),
      width: Math.max(0, Math.min(Math.round(width), size.width - Math.max(0, Math.round(x)))),
      height: Math.max(0, Math.min(Math.round(height), size.height - Math.max(0, Math.round(y)))),
    };
    visibleBounds = clipped;
    view.setBounds(clipped);
    view.setVisible(input.visible !== false && width > 0 && height > 0);
  }
  async function playerOnly() {
    if (!view || view.webContents.isDestroyed()) return;
    await view.webContents
      .executeJavaScript(
        `(() => {
      const player = [...document.querySelectorAll('iframe')].find(f => { try { const u = new URL(f.src); return u.origin === ${JSON.stringify(ORIGIN)} && u.pathname.startsWith('/vid/'); } catch { return false; } });
      if (!player) return false;
      if (!document.getElementById('harutv-player-layout')) { const style = document.createElement('style'); style.id = 'harutv-player-layout'; style.textContent = 'html,body{margin:0!important;overflow:hidden!important;background:#000!important}body *{visibility:hidden!important}iframe[data-harutv-player]{visibility:visible!important;position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;border:0!important;z-index:2147483647!important}'; document.head.appendChild(style); }
      player.setAttribute('data-harutv-player',''); return true;
    })()`,
      )
      .catch(() => false);
  }
  async function viewRequest(parent, input) {
    if (!input || typeof input !== 'object') throw new Error('无效的网页播放器操作');
    if (!['attach', 'bounds', 'state', 'seek', 'close'].includes(input.action))
      throw new Error('网页播放器操作不受支持');
    if (input.action === 'close') {
      closeView();
      return {};
    }
    if (input.action === 'attach') {
      const path = pagePath({ action: 'resolve', url: input.url });
      getWorker();
      if (!view) {
        viewParent = parent;
        view = new WebContentsView({
          webPreferences: {
            partition,
            sandbox: true,
            nodeIntegration: false,
            contextIsolation: true,
            backgroundThrottling: false,
          },
        });
        parent.contentView.addChildView(view);
        view.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
        view.webContents.on('will-navigate', (event, url) => {
          if (new URL(url).origin !== ORIGIN) event.preventDefault();
        });
        view.webContents.on('dom-ready', () => {
          void playerOnly();
        });
        view.webContents.on('did-frame-finish-load', () => {
          void playerOnly();
        });
        view.webContents.on('enter-html-full-screen', () => {
          siteFullscreen = true;
          parent.setFullScreen(true);
          const [width, height] = parent.getContentSize();
          view?.setBounds({ x: 0, y: 0, width, height });
        });
        view.webContents.on('leave-html-full-screen', () => {
          siteFullscreen = false;
          parent.setFullScreen(false);
          if (view && visibleBounds) view.setBounds(visibleBounds);
        });
      }
      position(parent, input.bounds);
      if (viewUrl !== path) {
        viewUrl = path;
        started = false;
        void view.webContents.loadURL(ORIGIN + path).catch(() => {});
      }
      return {};
    }
    if (input.action === 'bounds') {
      position(parent, input.bounds);
      return {};
    }
    if (!view || view.webContents.isDestroyed()) return { ready: false };
    await playerOnly();
    for (const frame of [view.webContents.mainFrame, ...view.webContents.mainFrame.frames]) {
      if (!frame.url.startsWith(ORIGIN + '/')) continue;
      if (input.action === 'seek' && Number.isFinite(input.time) && input.time >= 0) {
        await frame
          .executeJavaScript(
            `(() => { const v=document.querySelector('video'); if(v && Number.isFinite(v.duration)) v.currentTime=Math.min(${JSON.stringify(input.time)},Math.max(0,v.duration-1)); })()`,
          )
          .catch(() => {});
      }
      const state = await frame
        .executeJavaScript(
          `(() => { const v=document.querySelector('video'); if(!v)return null; ${!started ? 'void v.play().catch(()=>{});' : ''} return { ready:true, time:v.currentTime, duration:Number.isFinite(v.duration)?v.duration:0, paused:v.paused, ended:v.ended, width:v.videoWidth, height:v.videoHeight, decodedFrames:v.getVideoPlaybackQuality?.().totalVideoFrames||0, error:v.error?.message||'' }; })()`,
        )
        .catch(() => null);
      if (state) {
        started = true;
        return state;
      }
    }
    return { ready: false };
  }
  return {
    view: viewRequest,
    request(input) {
      const path = pagePath(input);
      const run = () =>
        input.action === 'resolve'
          ? resolve(path)
          : input.action === 'verify'
            ? navigate(path, true).then((html) => ({ html }))
            : html(path).then((html) => ({ html }));
      const task = serial.then(run, run);
      serial = task.catch(() => {});
      return task;
    },
    close() {
      closeView();
      if (worker && !worker.isDestroyed()) worker.destroy();
    },
  };
}
module.exports = { createLibvio, pagePath, mediaUrl, fullscreenAllowed };
