<script setup lang="ts">
</script>

<template>
  <div class="content-box-container">
    <slot></slot>
  </div>
</template>

<style scoped>
  .content-box-container {
    background-color: var(--background-secondary);
    padding: 30px 15px;
    border-radius: var(--window-corner-radius);
    font-size: 18px;
  }
</style>
