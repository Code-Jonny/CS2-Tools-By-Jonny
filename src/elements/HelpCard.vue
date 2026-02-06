<script setup lang="ts">
  import Card from "./Card.vue";

  interface Props {
    title?: string;
    icon?: string | "questionmark";
  }

  withDefaults(defineProps<Props>(), {
    title: "Help",
    icon: "info-circle",
  });
</script>

<template>
  <Card :title="title" :icon="icon">
    <div class="help-content">
      <slot></slot>
    </div>
  </Card>
</template>

<style scoped>
  .help-content {
    color: var(--text-secondary);
    font-size: 14px;
    line-height: 1.5;
  }

  .help-content :deep(p) {
    margin-bottom: 10px;
  }

  :deep(.rating) {
    margin-top: 30px;
    background-color: var(--background-primary);
    padding: 15px;
    border-radius: var(--window-corner-radius);
  }

  :deep(.rating h3) {
    font-size: 16px;
    text-align: center;
  }

</style>
