const {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  session,
  Menu,
} = require("electron");
const { spawn } = require("node:child_process");
const { randomBytes } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
let server,
  win,
  origin,
  stopping = false;
app.setName("haruTV");
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on("second-instance", () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
  if (process.env.HARUTV_DEBUG_PORT)
    app.commandLine.appendSwitch(
      "remote-debugging-port",
      process.env.HARUTV_DEBUG_PORT,
    );
  const request = (url, options = {}) =>
    new Promise((resolve, reject) => {
      const req = http.request(url, options, (res) => {
        let body = "";
        res.on("data", (d) => (body += d));
        res.on("end", () =>
          resolve({ status: res.statusCode, headers: res.headers, body }),
        );
      });
      req.on("error", reject);
      req.setTimeout(3000, () => req.destroy(new Error("timeout")));
      if (options.body) req.write(options.body);
      req.end();
    });
  async function boot() {
    const data = app.getPath("userData");
    fs.mkdirSync(data, { recursive: true });
    const settingsFile = path.join(data, "desktop.json");
    let settings;
    try {
      settings = JSON.parse(fs.readFileSync(settingsFile, "utf8"));
    } catch {
      settings = { password: randomBytes(32).toString("hex"), port: 17834 };
      fs.writeFileSync(settingsFile, JSON.stringify(settings));
    }
    const presets = require("./source-presets.json");
    origin = `http://127.0.0.1:${settings.port}`;
    const serverRoot = app.isPackaged
      ? path.join(process.resourcesPath, "server")
      : path.join(__dirname, "../.next/standalone");
    const serverFile = path.join(serverRoot, "server.js");
    if (!fs.existsSync(serverFile))
      throw new Error("请先运行 npm run build:desktop，生成 haruTV 桌面服务。");
    // The service is loopback-only. Renderer never receives the local access password.
    server = spawn(process.execPath, [serverFile], {
      cwd: serverRoot,
      windowsHide: true,
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: "1",
        NODE_ENV: "production",
        HOSTNAME: "127.0.0.1",
        PORT: String(settings.port),
        PASSWORD: settings.password,
        COOKIE_SECURE: "false",
        DEFAULT_IMAGE_MODE: "proxy",
        DEFAULT_SOURCES: JSON.stringify(presets.sources),
        DEFAULT_LIVE_SOURCES: JSON.stringify(presets.liveSources),
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let startupError = "";
    server.stdout.on("data", () => {});
    server.stderr.on("data", (chunk) => {
      startupError = (startupError + chunk.toString()).slice(-4000);
    });
    const startupFailure = () => {
      const missing = startupError.match(/Cannot find module ['"]([^'"]+)['"]/);
      if (missing)
        return new Error(
          "安装包缺少本地服务依赖：" + missing[1] + "。请重新安装修复版。",
        );
      if (startupError.includes("EADDRINUSE"))
        return new Error(
          "本地服务端口 " +
            settings.port +
            " 已被占用，请关闭其他 haruTV 实例后重试。",
        );
      return new Error(
        "本地服务启动失败。" +
          (startupError.trim().slice(-1200) || "请重新启动应用。"),
      );
    };
    let exited = false;
    server.on("exit", () => {
      exited = true;
      if (!stopping && win) {
        require("electron").dialog.showErrorBox(
          "haruTV 服务已停止",
          "请重新启动应用。",
        );
        app.quit();
      }
    });
    server.on("error", () => {
      exited = true;
    });
    let ready = false;
    for (let i = 0; i < 160; i++) {
      if (exited) throw startupFailure();
      try {
        const r = await request(origin + "/api/status");
        if (r.status === 200) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 250));
    }
    if (!ready) throw new Error("本地服务启动超时。");
    const login = await request(origin + "/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: settings.password }),
    });
    if (login.status !== 200) throw new Error("本地服务验证失败。");
    const raw = login.headers["set-cookie"]?.find((c) =>
      c.startsWith("ltv_session="),
    );
    if (!raw) throw new Error("无法建立本地会话。");
    await session.defaultSession.cookies.set({
      url: origin,
      name: "ltv_session",
      value: raw.split(";")[0].slice("ltv_session=".length),
      httpOnly: true,
      sameSite: "lax",
      expirationDate: Date.now() / 1000 + 90 * 86400,
    });
    session.defaultSession.webRequest.onHeadersReceived(
      { urls: [origin + "/*"] },
      (details, callback) =>
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            "Content-Security-Policy": [
              "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' http: https: data: blob:; media-src 'self' http: https: blob:; connect-src 'self' http: https:; worker-src 'self' blob:; font-src 'self' data:; object-src 'none'; base-uri 'self'",
            ],
          },
        }),
    );
    let bounds = { width: 1360, height: 900 };
    try {
      const b = JSON.parse(
        fs.readFileSync(path.join(data, "window.json"), "utf8"),
      );
      bounds = {
        width: Math.max(
          960,
          Math.min(
            b.width || 1360,
            require("electron").screen.getPrimaryDisplay().workAreaSize.width,
          ),
        ),
        height: Math.max(
          640,
          Math.min(
            b.height || 900,
            require("electron").screen.getPrimaryDisplay().workAreaSize.height,
          ),
        ),
      };
    } catch {}
    win = new BrowserWindow({
      ...bounds,
      minWidth: 860,
      minHeight: 600,
      title: "haruTV",
      backgroundColor: "#181c1a",
      frame: false,
      show: false,
      icon: path.join(serverRoot, "public/harutv.ico"),
      webPreferences: {
        preload: path.join(__dirname, "preload.cjs"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });
    Menu.setApplicationMenu(null);
    const trusted = (e) =>
      e.sender === win?.webContents &&
      e.senderFrame?.url.startsWith(origin + "/");
    ipcMain.on("haru:minimize", (e) => {
      if (trusted(e)) win.minimize();
    });
    ipcMain.on("haru:maximize", (e) => {
      if (trusted(e)) win.isMaximized() ? win.unmaximize() : win.maximize();
    });
    ipcMain.on("haru:close", (e) => {
      if (trusted(e)) win.close();
    });
    const external = (url) => {
      try {
        if (["https:", "http:"].includes(new URL(url).protocol))
          void shell.openExternal(url);
      } catch {}
    };
    win.webContents.setWindowOpenHandler(({ url }) => {
      external(url);
      return { action: "deny" };
    });
    win.webContents.on("will-navigate", (e, url) => {
      if (new URL(url).origin !== origin) {
        e.preventDefault();
        external(url);
      }
    });
    win.on("close", () => {
      if (!win.isMaximized())
        fs.writeFileSync(
          path.join(data, "window.json"),
          JSON.stringify(win.getBounds()),
        );
    });
    win.once("ready-to-show", () => win.show());
    await win.loadURL(origin);
  }
  app
    .whenReady()
    .then(boot)
    .catch((err) => {
      require("electron").dialog.showErrorBox("haruTV 无法启动", err.message);
      app.quit();
    });
  app.on("window-all-closed", () => app.quit());
  app.on("before-quit", () => {
    stopping = true;
    if (server) server.kill();
  });
}
