<script setup lang="ts">
  import Icon from "@icons/Icon.vue";


  const props = defineProps<{
    label: string;
    id: string;
    name?: string;
    disabled?: boolean;
    checked: boolean;
  }>();

  const emit = defineEmits<{
    (e: 'update:checked', value: boolean): void;
  }>();

  const handleChange = (e: Event) => {
    emit('update:checked', (e.target as HTMLInputElement).checked);
  }
</script>

<template>
  <div class="toggle-component">
    <Icon v-if="checked" iconName="check-circle" size="24"
          class="icon icon--enabled" style="color: var(--success-color);" />
    <Icon v-else iconName="check-circle-line" size="24"
          class="icon icon--disabled" style="color: var(--icon-color);" />
    <label :for="id" :class="{ disabled: disabled }"
           class="toggle-label">{{ label }}</label>
    <div class="toggle-switch-container">
      <input type="checkbox" :id="id" :name="name" :disabled="disabled"
             :checked="checked" @change="handleChange"
             class="visually-hidden" />
    </div>
  </div>
</template>

<style scoped>
  :global(:root) {
    --spacing-small: 8px;
    --spacing-medium: 16px;
    --font-size-normal: 16px;
    --icon-color: #666;
  }

  .toggle-component {
    display: flex;
    align-items: center;
    gap: var(--spacing-small);
  }

  .toggle-label {
    /* font-size: var(--font-size-normal); */
    color: var(--text-color-primary);
    cursor: pointer;
    user-select: none;
  }

  .toggle-label.disabled {
    color: var(--text-color-disabled);
    cursor: not-allowed;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
  }
</style>
