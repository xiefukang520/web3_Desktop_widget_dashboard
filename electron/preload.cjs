const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld("electronAPI", {
  hide: () => ipcRenderer.send("app:hide"),
  minimize: () => ipcRenderer.send("app:minimize"),
  quit: () => ipcRenderer.send("app:quit"),
  openExternal: (url) => ipcRenderer.send("app:open-external", url),
  setAlwaysOnTop: (flag) => ipcRenderer.send("app:set-always-on-top", flag),
  toggleCompact: (isCompact) => ipcRenderer.send("app:toggle-compact", isCompact)
});
