<script setup lang="ts">
  import { Icon } from "@iconify/vue";

  defineProps<{
    title?: string;
    icon?: string;
    titleTag?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
    hasShadow?: boolean;
  }>();
</script>

<template>
  <div class="card-container" :class="{ 'has-shadow': hasShadow !== false }">
    <div v-if="title || icon || $slots.header_actions" class="card-header">
      <div class="card-header-main">
        <Icon v-if="icon" :icon="icon" width="24" height="24" />
        <component :is="titleTag || 'h3'" v-if="title" class="card-title">
          {{ title }}
        </component>
      </div>
      <div v-if="$slots.header_actions" class="card-header-actions">
        <slot name="header_actions"></slot>
      </div>
    </div>
    <div class="card-content">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
  .card-container {
    background-color: var(--background-secondary);
    border-radius: var(--window-corner-radius);
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .card-container.has-shadow {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--background-primary);
  }

  .card-header-main {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .card-title {
    margin: 0;
    color: var(--primary-accent);
    font-size: 18px;
    font-weight: 500;
  }

  .card-header :deep(svg) {
    color: var(--primary-accent);
  }
</style>
