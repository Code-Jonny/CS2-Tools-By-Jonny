<script setup lang="ts">
  import { Icon } from "@iconify/vue";


  const props = defineProps<{
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    variant?: "primary" | "secondary" | "danger" | "success" | "icon";
    icon?: string;
    iconSize?: string;
  }>();

  const emit = defineEmits<{
    (e: 'click', event: MouseEvent): void;
  }>();

  const handleClick = (event: MouseEvent) => {
    if (!props.disabled) {
      emit('click', event);
    }
  };
</script>

<template>
  <button :type="type || 'button'" :disabled="disabled" @click="handleClick" class="button" :class="variant || 'primary'">
    <Icon v-if="icon" :icon="icon" :width="iconSize || '20'" :height="iconSize || '20'" />
    <slot></slot>
  </button>
</template>

<style scoped>
  .button {
    padding: 8px 15px;
    border: none;
    border-radius: var(--window-corner-radius, 4px);
    cursor: pointer;
    font-family: var(--font-family-inter);
    font-size: 16px;
    font-weight: 600;
    transition: background-color 0.2s ease-in-out, opacity 0.2s ease-in-out;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Primary Button */
  .button.primary {
    background-color: var(--primary-accent, #00bfff);
    color: var(--background-primary, #1a1a1a);
  }

  .button.primary:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  .button.primary:active:not(:disabled) {
    filter: brightness(0.9);
  }

  /* Secondary Button */
  .button.secondary {
    background-color: transparent;
    color: var(--text-primary, #e0e0e0);
    border: 1px solid var(--text-secondary, #888888);
  }

  .button.secondary:hover:not(:disabled) {
    background-color: var(--background-secondary, #242424);
  }

  .button.secondary:active:not(:disabled) {
    background-color: var(--background-primary, #1a1a1a);
  }

  /* Danger Button */
  .button.danger {
    background-color: var(--error-color, #dc3545);
    color: var(--text-primary, #e0e0e0);
  }

  .button.danger:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  .button.danger:active:not(:disabled) {
    filter: brightness(0.9);
  }

  /* Success Button */
  .button.success {
    background-color: var(--success-color, #28a745);
    color: var(--text-primary, #e0e0e0);
  }

  .button.icon {
    background: transparent;
    color: var(--text-primary);
    padding: 4px;
  }
</style>
