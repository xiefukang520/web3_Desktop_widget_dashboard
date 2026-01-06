import {
  app,
  BrowserWindow,
  globalShortcut,
  Tray,
  Menu,
  nativeImage,
  screen,
  ipcMain,
  shell
} from "electron";
import path from "node:path";
import url from "node:url";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let win = null;
let tray = null;
const isDev = !!process.env.ELECTRON_DEV;

const createTray = () => {
  const iconPath = path.join(__dirname, "icon.ico");
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon);
  tray.setToolTip("Crypto Widget");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "显示/隐藏", click: toggleWindow },
      { type: "separator" },
      { label: "退出", click: () => app.quit() }
    ])
  );
  tray.on("click", toggleWindow);
};

const createWindow = () => {
  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;
  const windowWidth = 380;
  const windowHeight = 540;
  const margin = 20;
  const x = Math.max(margin, screenW - windowWidth - margin);
  const y = Math.max(margin, Math.floor((screenH - windowHeight) / 2));

  win = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    minWidth: 320,
    minHeight: 420,
    x,
    y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: false,
    show: false,
    icon: path.join(__dirname, "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const devUrl = "http://localhost:5173";
  const prodUrl = url.pathToFileURL(path.join(__dirname, "../dist/index.html")).toString();
  const target = isDev ? devUrl : prodUrl;
  win.loadURL(target);

  win.once("ready-to-show", () => win?.show());
  win.on("closed", () => {
    win = null;
  });
};

function toggleWindow() {
  if (!win) return;
  if (win.isVisible()) {
    win.hide();
  } else {
    win.show();
    win.focus();
  }
}

app.whenReady().then(() => {
  createWindow();
  createTray();
  globalShortcut.register("CommandOrControl+Shift+X", toggleWindow);

  ipcMain.on("app:hide", () => {
    win?.hide();
  });

  ipcMain.on("app:minimize", () => {
    win?.minimize();
  });

  ipcMain.on("app:quit", () => {
    app.quit();
  });

  ipcMain.on("app:open-external", (event, url) => {
    shell.openExternal(url);
  });

  ipcMain.on("app:set-always-on-top", (event, flag) => {
    win?.setAlwaysOnTop(flag);
  });

  ipcMain.on("app:toggle-compact", (event, isCompact) => {
    if (!win) return;
    const { x, y, width, height } = win.getBounds();
    const windowWidth = isCompact ? 220 : 380;
    const windowHeight = isCompact ? 140 : 540;
    
    // Maintain top-right corner if possible, or just resize
    win.setMinimumSize(isCompact ? 180 : 320, isCompact ? 100 : 420);
    win.setSize(windowWidth, windowHeight, true);
  });
});

app.on("second-instance", () => {
  if (win) {
    if (!win.isVisible()) win.show();
    win.focus();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

