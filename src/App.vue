<template>
  <div class="page">
    <CryptoWidget />
  </div>
</template>

<script setup lang="ts">
import CryptoWidget from "./components/CryptoWidget.vue";
</script>

<style>
/* 移除 App 层的背景，让 Electron 窗口透明生效 */
body {
  background: transparent !important;
}
</style>
