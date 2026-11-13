const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld(
  "haruDesktop",
  Object.freeze({
    platform: process.platform,
    minimize: () => ipcRenderer.send("haru:minimize"),
    maximize: () => ipcRenderer.send("haru:maximize"),
    close: () => ipcRenderer.send("haru:close"),
    libvio: (request) => ipcRenderer.invoke("haru:libvio", request),
    libvioView: (request) => ipcRenderer.invoke("haru:libvio-view", request),
  }),
);
