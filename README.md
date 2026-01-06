# CryptoWidget 桌面挂件说明

## 概览
一个基于 Electron + Vite + Vue3 的桌面行情挂件，支持全模式 / 缩略模式、一键置顶、昼夜主题切换、币种自选与本地持久化，并提供托盘控制。

## 功能特性
- 实时行情：默认展示 BTC / ETH / SOL，支持搜索添加/删除（本地持久化）。
- 多源数据：Binance / OKX WebSocket 行情。
- 窗口模式：全模式与缩略模式（胶囊条），双击缩略条或点 “⤢” 还原。
- 主题：昼夜主题切换，缩略模式自适应配色。
- 置顶开关：用户可决定是否始终置顶。
- 外链快捷：底部提供 Binance / OKX 市场页面跳转（默认浏览器打开）。
- 托盘与快捷键：托盘点击显示/隐藏，`Ctrl+Shift+X` 切换显示/隐藏。

## 环境要求
- Node.js 18+（建议 18/20 LTS）
- pnpm 8+
- Windows 10/11（当前构建目标）

## 安装与开发
```bash
pnpm install
# 开发模式（前端 + Electron）
pnpm run dev:app
# 或仅前端
pnpm run dev
```

## 打包
```bash
pnpm run build:app
```
产物：
- 安装包：`dist/CryptoWidget Setup 0.0.1.exe`
- 便携版：`dist/win-unpacked/CryptoWidget.exe`

## 运行与操作
- **全模式入口**：安装后从开始菜单/桌面快捷方式或 `win-unpacked/CryptoWidget.exe` 启动。
- **显示/隐藏**：托盘点击，或快捷键 `Ctrl+Shift+X`。
- **窗口控制（头部）**：`–` 隐藏、`×` 关闭。
- **置顶**：底部 📌 切换。
- **主题**：底部 ☀ / 🌙 切换。
- **缩略模式**：底部 “⤢” 进入；缩略条右侧 “⤢” 或双击缩略条恢复；缩略条也有 `–` / `×`。
- **外链**：底部 Binance / OKX 图标，默认浏览器打开。

## 数据持久化
- 自选列表与主题：存储于 `localStorage`，重启后保留。
- 若需重置：在开发者工具 Application > Local Storage 清除 `cryptoWidget.watchlist` 和 `cryptoWidget.theme`。

## 目录结构（摘录）
```
electron/          # 主进程与预加载
  main.js
  preload.cjs
src/               # 渲染进程
  main.ts
  App.vue
  components/CryptoWidget.vue
  style.css
vite.config.ts     # Vite 配置（生产 base 设置为 ./ 适配 file://）
```

## 常见问题
- 打包后白屏：确认 `vite.config.ts` 中 `base` 为 `./`。
- 按钮点击无反应：确保 `preload.cjs` 被正确加载（已在 `main.js` 指向 `preload.cjs`）。
- 安装器每次都弹出：请从已安装的程序或 `win-unpacked/CryptoWidget.exe` 启动，不要反复运行 Setup。

## 构建配置要点
- Electron Builder：`build` 字段配置 `icon` 为 `electron/icon.ico`，目标 `nsis`。
- 生产资源：`dist` 内的前端静态文件 + `electron` 目录一同打包。

如需进一步的定制（主题色、缩略条尺寸、默认币种），可告知需求。 

