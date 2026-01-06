<template>
  <div class="mini-bar" :class="alertClass" @dblclick="$emit('restore')">
    <div class="mini-left">
      <span class="mini-title">W3T</span>
      <div class="mini-items">
        <div v-for="item in watchlist.slice(0, 2)" :key="item.id" class="mini-item">
          <span class="mini-symbol">{{ item.base }}</span>
          <span class="mini-price mono">{{ formatPrice(prices[item.id]?.last) }}</span>
          <span class="mini-change" :class="getPctClass(prices[item.id]?.changePct)">
            {{ formatPct(prices[item.id]?.changePct) }}
          </span>
        </div>
      </div>
    </div>
    <div class="mini-actions">
      <button class="mini-btn primary" title="返回全模式" @click="$emit('restore')">⤢</button>
      <button class="mini-btn" title="隐藏" @click="$emit('hide')">–</button>
      <button class="mini-btn danger" title="关闭" @click="$emit('close')">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatPrice, formatPct, getPctClass } from "../../utils/format";
import type { WatchItem, Price } from "../../types";

defineProps<{
  watchlist: WatchItem[];
  prices: Record<string, Price>;
  alertClass: string;
}>();

defineEmits<{
  (e: "restore"): void;
  (e: "hide"): void;
  (e: "close"): void;
}>();
</script>

