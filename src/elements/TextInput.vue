<script setup lang="ts">
  import { Icon } from "@iconify/vue";
  import { computed } from 'vue';

  type InputMode = "none" | "text" | "decimal" | "numeric" | "tel" | "search" | "email" | "url";

  const props = defineProps<{
    label?: string;
    id?: string;
    name?: string;
    modelValue: string;
    inputmode?: InputMode;
    placeholder?: string;
    error?: string | null;
    icon?: string;
    iconSize?: string;
  }>();

  const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
    (e: 'input', event: Event): void;
    (e: 'change', event: Event): void;
    (e: 'blur', event: FocusEvent): void;
    (e: 'submit'): void;
  }>();

  const uniqueId = computed(() => props.id || `text-input-${Math.random().toString(36).substring(2, 9)}`);

  const handleInput = (event: Event) => {
    emit('update:modelValue', (event.target as HTMLInputElement).value);
    emit('input', event);
  };

  const handleChange = (event: Event) => {
    emit('change', event);
  };

  const handleBlur = (event: FocusEvent) => {
    emit('blur', event);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      emit('submit');
    }
  };
</script>

<template>
  <div class="text-input-wrapper">
    <label v-if="label" :for="uniqueId" class="input-label">{{ label }}</label>
    <div class="input-container" :class="{ 'has-icon': icon }">
      <Icon v-if="icon" :icon="icon" :width="iconSize || '20'"
            :height="iconSize || '20'" class="input-icon" />
      <input :value="modelValue"
             :type="inputmode === 'numeric' || inputmode === 'decimal' ? 'number' : 'text'"
             :id="uniqueId" :name="name || uniqueId" @input="handleInput"
             @change="handleChange" @blur="handleBlur" @keydown="handleKeyDown"
             :placeholder="placeholder" class="text-input"
             :class="{ 'has-error': error }" :inputmode="inputmode" />
    </div>
    <div v-if="error" class="error-message">{{ error }}</div>
  </div>
</template>

<style scoped>
  .text-input-wrapper {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
  }

  .input-label {
    font-size: 14px;
    color: var(--text-primary);
    font-weight: 500;
  }

  .input-container {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-icon {
    position: absolute;
    left: 10px;
    color: var(--text-secondary);
    pointer-events: none;
    /* Allow clicking through to input */
  }

  .text-input {
    width: 100%;
    background-color: var(--background-primary);
    border: 1px solid var(--text-secondary);
    /* Border color */
    border-radius: var(--window-corner-radius);
    padding: 10px 12px;
    font-family: var(--font-family-inter);
    font-size: 16px;
    color: var(--text-primary);
    outline: none;
    transition:
      border-color 0.2s,
      box-shadow 0.2s;
  }

  /* Padding when icon is present */
  .input-container.has-icon .text-input {
    padding-left: 36px;
    /* Space for icon */
  }

  .text-input:focus {
    border-color: var(--primary-accent);
    /* box-shadow: 0 0 0 2px rgba(0, 191, 255, 0.2); */
  }

  .text-input::placeholder {
    color: var(--text-secondary);
    opacity: 0.7;
  }

  .text-input.has-error {
    border-color: var(--error-color, #dc3545);
  }

  .error-message {
    color: var(--error-color, #dc3545);
    font-size: 12px;
  }
</style>
