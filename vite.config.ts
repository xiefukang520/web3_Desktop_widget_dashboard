import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// Electron uses the file:// protocol in production, so we need a relative base
// path, otherwise the built assets are looked up from /assets and fail to load.
export default defineConfig(({ command }) => ({
  base: command === "serve" ? "/" : "./",
  plugins: [vue()],
  server: {
    port: 5173,
    host: true
  }
}));

