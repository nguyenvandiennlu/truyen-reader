const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  platform: process.platform,
  sendMediaCommand: (command) => ipcRenderer.send("media-command", command),
  onMediaCommand: (callback) => ipcRenderer.on("media-command", (event, ...args) => callback(...args)),
  toggleFullscreen: () => ipcRenderer.send("toggle-fullscreen")
});
