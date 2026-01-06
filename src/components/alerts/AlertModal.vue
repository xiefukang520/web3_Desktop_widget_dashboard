<template>
  <div v-if="visible" class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal">
      <h3>价格预警</h3>
      <p class="modal-sub">设置高于/低于阈值的闪烁提示，可多条预警</p>

      <div v-if="alerts.length" class="modal-list">
        <div class="modal-alert-item" v-for="(a, idx) in alerts" :key="idx">
          <div class="pill" :class="a.direction === 'above' ? 'pill-up' : 'pill-down'">
            <span class="pill-label">{{ a.direction === 'above' ? '高于' : '低于' }}</span>
            <span class="pill-value">{{ a.threshold }}</span>
            <span v-if="a.triggered" class="pill-dot">●</span>
          </div>
          <div class="modal-alert-actions">
            <button class="mini-btn primary" @click="$emit('stop')">停</button>
            <button class="mini-btn danger" @click="$emit('remove', idx)">删</button>
          </div>
        </div>
      </div>

      <div class="modal-row">
        <label>方向</label>
        <div class="modal-switch">
          <button :class="{ active: direction === 'above' }" @click="$emit('direction-change', 'above')">高于</button>
          <button :class="{ active: direction === 'below' }" @click="$emit('direction-change', 'below')">低于</button>
        </div>
      </div>
      <div class="modal-row">
        <label>阈值</label>
        <input type="number" :value="value ?? ''" @input="$emit('value-change', Number(($event.target as HTMLInputElement).value))" />
      </div>
      <div class="modal-actions">
        <button class="modal-btn ghost" @click="$emit('close')">取消</button>
        <button class="modal-btn primary" @click="$emit('save')">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AlertItem } from "../../composables/useAlerts";

defineProps<{
  visible: boolean;
  alerts: AlertItem[];
  direction: "above" | "below";
  value: number | null;
}>();

defineEmits<{
  (e: "close"): void;
  (e: "save"): void;
  (e: "remove", idx: number): void;
  (e: "stop"): void;
  (e: "direction-change", dir: "above" | "below"): void;
  (e: "value-change", val: number): void;
}>();
</script>

