const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld("electronAPI", {
  hide: () => ipcRenderer.send("app:hide"),
  minimize: () => ipcRenderer.send("app:minimize"),
  quit: () => ipcRenderer.send("app:quit")
});
