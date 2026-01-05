import { app, BrowserWindow, globalShortcut, Tray, Menu, nativeImage } from "electron";
import path from "node:path";
import url from "node:url";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let win = null;
let tray = null;
const isDev = !!process.env.ELECTRON_DEV;

const createTray = () => {
  const dataUrl =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAUVBMVEUAAAD///////////////////////////////////////////////////////////////////////////////////////////////////////+F4cilAAAAGXRSTlMAAQIDBAUGBwgJCgsMDQ8QERITFBUWFxgYxNrW8AAAAEJJREFUGNOdjEsSgkAQRc+YAQECdVvz/79JdImb0nZnkzE6aZMcJL6rTqLn24+xEHFyOErDaCTQJVhCuY5fUJXxf0w0lg0tBxJzSpYdpkKBqtiN2ohTVp5WabAJ6EgfEtDJj+ynf1UQMTuStXIFru82+5mw0H2sIUAJB2X+9QG9vYb7yVj8gAAAAASUVORK5CYII=";
  const icon = nativeImage.createFromDataURL(dataUrl);
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
  win = new BrowserWindow({
    width: 380,
    height: 540,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
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

