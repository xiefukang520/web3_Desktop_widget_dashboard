<template>
  <div class="widget-container">
    <!-- 头部：标题与搜索入口 -->
    <header class="widget-header">
      <div class="title-group">
        <span class="pulse-dot"></span>
        <h1>Web3 Ticker</h1>
      </div>
      <div class="header-actions">
        <div class="search-trigger" :class="{ active: isSearchOpen }">
          <input
            v-model="search"
            placeholder="Search Symbol..."
            @focus="isSearchOpen = true"
            @blur="handleSearchBlur"
          />
          <kbd v-if="!isSearchOpen">Ctrl K</kbd>
        </div>
        <div class="window-controls">
          <button class="ctrl-btn" @click="toggleTheme" :title="isDark ? 'Switch to Light' : 'Switch to Dark'">
            <span>{{ isDark ? '☀' : '🌙' }}</span>
          </button>
          <button class="ctrl-btn" @click="handleHide" title="Hide">
            <span>–</span>
          </button>
          <button class="ctrl-btn" @click="handleMinimize" title="Minimize">
            <span>▭</span>
          </button>
          <button class="ctrl-btn danger" @click="handleQuit" title="Quit">
            <span>×</span>
          </button>
        </div>
      </div>
    </header>

    <!-- 搜索结果浮层 -->
    <Transition name="fade">
      <div v-if="isSearchOpen && searchResults.length" class="search-overlay">
        <div 
          v-for="s in searchResults" 
          :key="s.id" 
          class="search-item"
          @mousedown="addWatch(s)"
        >
          <img :src="iconUrl(s.base)" class="tiny-icon" @error="handleIconError" />
          <span class="s-pair">{{ s.base }}/{{ s.quote }}</span>
          <span class="s-ex">{{ s.ex }}</span>
        </div>
      </div>
    </Transition>

    <!-- 实时列表 -->
    <main class="price-list">
      <TransitionGroup name="list">
        <div 
          v-for="item in watchlist" 
          :key="item.id" 
          class="price-card"
          :class="flashClass[item.id]"
        >
          <div class="token-info">
            <div class="icon-stack">
              <img :src="iconUrl(item.base)" class="main-icon" @error="handleIconError" />
              <div class="ex-badge" :class="item.ex">{{ item.ex[0].toUpperCase() }}</div>
            </div>
            <div class="name-box">
              <span class="base">{{ item.base }}</span>
              <span class="quote">/{{ item.quote }}</span>
            </div>
          </div>

          <div class="value-box">
            <div class="price-val mono">
              {{ formatPrice(prices[item.id]?.last) }}
            </div>
            <div 
              class="change-val" 
              :class="getPctClass(prices[item.id]?.changePct)"
            >
              {{ formatPct(prices[item.id]?.changePct) }}
            </div>
          </div>

          <button class="remove-btn" @click="remove(item.id)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </TransitionGroup>

      <div v-if="!watchlist.length" class="empty-state">
        <div class="empty-icon">🪙</div>
        <p>No symbols tracked</p>
        <span>Search above to add assets</span>
      </div>
    </main>

    <footer class="widget-footer">
      <div class="status-bar">
        <span class="live-tag">LIVE</span>
        <span class="update-ts">{{ lastUpdate }}</span>
      </div>
      <div class="shortcuts">
        <span>Alt + H to Hide</span>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";

type Exchange = "binance" | "okx";
type WatchItem = { id: string; base: string; quote: string; ex: Exchange };
type Price = { last: number; changePct: number };
type SymbolItem = WatchItem & { symbol: string };

const ICON_BASE = "https://app.hyperliquid.xyz/coins/";
const STORAGE_KEY = "cryptoWidget.watchlist";
const THEME_KEY = "cryptoWidget.theme";
const DEFAULT_WATCHLIST: WatchItem[] = [
  { id: "BTCUSDT", base: "BTC", quote: "USDT", ex: "binance" },
  { id: "ETHUSDT", base: "ETH", quote: "USDT", ex: "binance" },
  { id: "SOL-USDT", base: "SOL", quote: "USDT", ex: "okx" }
];
declare global {
  interface Window {
    electronAPI?: {
      hide?: () => void;
      minimize?: () => void;
      quit?: () => void;
    };
  }
}

const search = ref("");
const isSearchOpen = ref(false);
const isDark = ref(true);
const watchlist = ref<WatchItem[]>([...DEFAULT_WATCHLIST]);

const prices = reactive<Record<string, Price>>({});
const flashClass = reactive<Record<string, string>>({});
const symbols = ref<SymbolItem[]>([]);
const lastUpdate = ref("");
const binanceWs = ref<WebSocket | null>(null);
const okxWs = ref<WebSocket | null>(null);

// UI Helpers
const iconUrl = (base: string) => `${ICON_BASE}${base.toUpperCase()}.svg`;
const handleIconError = (e: Event) => {
  (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3C/svg%3E";
};

const formatPrice = (v?: number) => {
  if (!v) return "---.--";
  if (v < 1) return v.toFixed(6);
  if (v < 10) return v.toFixed(4);
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatPct = (v?: number) => {
  if (v === undefined) return "0.00%";
  const prefix = v > 0 ? "+" : "";
  return `${prefix}${v.toFixed(2)}%`;
};

const getPctClass = (v?: number) => {
  if (!v) return "neutral";
  return v >= 0 ? "up" : "down";
};

const handleSearchBlur = () => {
  setTimeout(() => (isSearchOpen.value = false), 200);
};

// Window controls
const handleHide = () => window.electronAPI?.hide?.();
const handleMinimize = () => window.electronAPI?.minimize?.();
const handleQuit = () => window.electronAPI?.quit?.();

const toggleTheme = () => {
  isDark.value = !isDark.value;
  applyTheme();
  localStorage.setItem(THEME_KEY, isDark.value ? "dark" : "light");
};

const applyTheme = () => {
  if (isDark.value) {
    document.documentElement.classList.remove("light-theme");
  } else {
    document.documentElement.classList.add("light-theme");
  }
};

// Data Logic
const loadWatchlist = () => {
  try {
    // Load Theme
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) {
      isDark.value = savedTheme === "dark";
      applyTheme();
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        watchlist.value = parsed;
      }
    }
  } catch (e) {
    console.error("Failed to load watchlist", e);
  }
};

const saveWatchlist = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist.value));
  } catch (e) {
    console.error("Failed to save watchlist", e);
  }
};

const searchResults = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return [];
  return symbols.value
    .filter(s => s.base.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))
    .slice(0, 6);
});

const addWatch = (item: WatchItem) => {
  if (!watchlist.value.find(w => w.id === item.id)) {
    watchlist.value.push(item);
  }
  search.value = "";
  isSearchOpen.value = false;
};

const remove = (id: string) => {
  watchlist.value = watchlist.value.filter(w => w.id !== id);
};

// WebSocket Handlers
const updatePrice = (id: string, last: number, changePct: number) => {
  const oldPrice = prices[id]?.last;
  if (oldPrice && last !== oldPrice) {
    flashClass[id] = last > oldPrice ? "flash-up" : "flash-down";
    setTimeout(() => delete flashClass[id], 800);
  }
  prices[id] = { last, changePct };
  lastUpdate.value = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

// 保持之前的 API 加载逻辑，但 UI 适配
const loadSymbols = async () => {
  try {
    const [bRes, oRes] = await Promise.all([
      fetch("https://api.binance.com/api/v3/exchangeInfo"),
      fetch("https://www.okx.com/api/v5/public/instruments?instType=SPOT")
    ]);
    const bj = await bRes.json();
    const oj = await oRes.json();
    
    const bl = bj.symbols?.filter((s:any) => s.quoteAsset === "USDT").map((s:any) => ({
      id: s.symbol, symbol: s.symbol, base: s.baseAsset, quote: s.quoteAsset, ex: "binance"
    })) || [];
    
    const ol = oj.data?.filter((s:any) => s.quoteCcy === "USDT").map((s:any) => ({
      id: s.instId, symbol: s.instId, base: s.baseCcy, quote: s.quoteCcy, ex: "okx"
    })) || [];
    
    symbols.value = [...bl, ...ol];
  } catch(e) { console.error(e); }
};

const connectBinance = () => {
  binanceWs.value?.close();
  const targets = watchlist.value.filter(w => w.ex === "binance").map(w => w.id.toLowerCase() + "@ticker");
  if (!targets.length) return;
  const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${targets.join("/")}`);
  binanceWs.value = ws;
  ws.onmessage = (e) => {
    const d = JSON.parse(e.data)?.data;
    if (d) updatePrice(d.s, Number(d.c), Number(d.P));
  };
};

const connectOkx = () => {
  okxWs.value?.close();
  const targets = watchlist.value.filter(w => w.ex === "okx").map(w => w.id);
  if (!targets.length) return;
  const ws = new WebSocket("wss://ws.okx.com:8443/ws/v5/public");
  okxWs.value = ws;
  ws.onopen = () => {
    ws.send(JSON.stringify({ op: "subscribe", args: targets.map(id => ({ channel: "tickers", instId: id })) }));
  };
  ws.onmessage = (e) => {
    const d = JSON.parse(e.data)?.data?.[0];
    if (d) {
      const last = Number(d.last);
      const open = Number(d.sodUtc0);
      const pct = open ? ((last - open) / open) * 100 : 0;
      updatePrice(d.instId, last, pct);
    }
  };
};

watch(
  watchlist,
  () => {
    connectBinance();
    connectOkx();
    saveWatchlist();
  },
  { immediate: true, deep: true }
);

onMounted(() => {
  loadWatchlist();
  loadSymbols();
});
onBeforeUnmount(() => {
  binanceWs.value?.close();
  okxWs.value?.close();
});
</script>

<style scoped>
.widget-container {
  background: var(--bg-color);
  backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  width: 100%;
  max-width: 380px;
  height: auto;
  min-height: 480px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  -webkit-app-region: drag;
}

/* Header */
.widget-header {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  background: var(--up-color);
  border-radius: 50%;
  box-shadow: 0 0 8px var(--up-color);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.5; }
}

h1 {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-dim);
}

.search-trigger {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--input-bg);
  border-radius: 8px;
  padding: 4px 8px;
  border: 1px solid transparent;
  transition: all 0.3s;
  -webkit-app-region: no-drag;
}

.search-trigger.active {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--accent-color);
}

.search-trigger input {
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-main);
  font-size: 12px;
  width: 80px;
  transition: width 0.3s;
}

.search-trigger.active input {
  width: 120px;
}

kbd {
  font-size: 9px;
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 4px;
  border-radius: 4px;
  color: var(--text-dim);
}

.window-controls {
  display: flex;
  gap: 6px;
  -webkit-app-region: no-drag;
}

.ctrl-btn {
  width: 28px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: var(--input-bg);
  color: var(--text-main);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  transition: background 0.2s, border-color 0.2s;
}

.ctrl-btn:hover {
  background: var(--card-hover);
  border-color: var(--text-dim);
}

.ctrl-btn.danger {
  color: #ef4444;
}

/* Search Overlay */
.search-overlay {
  position: absolute;
  top: 60px;
  right: 20px;
  width: 200px;
  background: var(--bg-color);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  z-index: 100;
  box-shadow: 0 10px 25px rgba(0,0,0,0.4);
  -webkit-app-region: no-drag;
}

.search-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.search-item:hover {
  background: rgba(255,255,255,0.05);
}

.tiny-icon {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  object-fit: contain;
  background: var(--input-bg);
}

.s-pair { font-size: 13px; flex: 1; }
.s-ex { font-size: 10px; color: var(--text-dim); }

/* Price List */
.price-list {
  padding: 12px;
  flex: 1;
  overflow-y: auto;
  -webkit-app-region: no-drag;
}

.price-card {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 14px;
  background: var(--card-bg);
  margin-bottom: 8px;
  transition: all 0.2s;
  position: relative;
  border: 1px solid transparent;
  -webkit-app-region: no-drag;
}

.price-card:hover {
  background: var(--card-hover);
  border-color: var(--border-color);
}

.token-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.icon-stack {
  position: relative;
}

.main-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--input-bg);
}

.ex-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 14px;
  height: 14px;
  font-size: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background: #000;
  font-weight: 800;
}

.ex-badge.binance { color: #f3ba2f; }
.ex-badge.okx { color: #fff; }

.name-box {
  display: flex;
  flex-direction: column;
}

.base {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-main);
}

.quote {
  font-size: 11px;
  color: var(--text-dim);
}

.value-box {
  text-align: right;
  margin-right: 8px;
}

.price-val {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
}

.mono {
  font-family: "JetBrains Mono", "Roboto Mono", monospace;
  letter-spacing: -0.02em;
}

.change-val {
  font-size: 12px;
  font-weight: 600;
}

.change-val.up { color: var(--up-color); }
.change-val.down { color: var(--down-color); }
.change-val.neutral { color: var(--text-dim); }

.remove-btn {
  opacity: 0;
  background: transparent;
  border: none;
  color: var(--text-dim);
  cursor: pointer;
  padding: 4px;
  transition: opacity 0.2s;
  -webkit-app-region: no-drag;
}

.price-card:hover .remove-btn {
  opacity: 1;
}

.remove-btn svg {
  width: 16px;
  height: 16px;
}

/* Footer */
.widget-footer {
  padding: 8px 20px;
  background: var(--footer-bg);
  display: flex;
  justify-content: space-between;
  align-items: center;
  -webkit-app-region: no-drag;
}

.status-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.live-tag {
  font-size: 9px;
  font-weight: 800;
  color: var(--up-color);
  border: 1px solid var(--up-color);
  padding: 1px 4px;
  border-radius: 4px;
}

.update-ts {
  font-size: 10px;
  color: var(--text-dim);
  font-family: monospace;
}

.shortcuts {
  font-size: 10px;
  color: var(--text-dim);
}

/* Keep interactive elements clickable in a draggable window */
input, button, .search-item {
  -webkit-app-region: no-drag;
}

/* Transitions */
.list-enter-active, .list-leave-active {
  transition: all 0.4s ease;
}
.list-enter-from, .list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--text-dim);
}

.empty-icon { font-size: 40px; margin-bottom: 12px; opacity: 0.5; }
.empty-state p { font-size: 14px; font-weight: 600; color: var(--text-main); }
.empty-state span { font-size: 12px; }
</style>
