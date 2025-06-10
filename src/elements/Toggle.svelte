<script lang="ts">
  import Icon from "@iconify/svelte";
  let {
    /**
     * The text label for the toggle.
     */
    label,

    /**
     * The current state of the toggle (true for checked, false for unchecked).
     * Can be bound using bind:checked.
     */
    checked = $bindable(),

    /**
     * A unique identifier for the toggle's input element.
     * Essential for associating the label with the checkbox for accessibility.
     */
    id,

    /**
     * Optional name attribute for the checkbox input.
     */
    name = undefined,

    /**
     * Optional disabled state for the toggle.
     * @default false
     */
    disabled = false,
  }: {
    label: string;
    checked: boolean;
    id: string;
    name?: string | undefined;
    disabled?: boolean;
  } = $props();
</script>

<div class="toggle-component">
  {#if checked}
    <Icon
      icon="solar:check-circle-bold"
      width="24"
      height="24"
      class="icon icon--enabled"
      style="color: var(--success-color);"
    />
  {:else}
    <Icon
      icon="solar:check-circle-linear"
      width="24"
      height="24"
      class="icon icon--disabled"
      style="color: var(--icon-color);"
    />
  {/if}
  <label for={id} class:disabled class="toggle-label">{label}</label>
  <div class="toggle-switch-container">
    <input
      type="checkbox"
      {id}
      {name}
      {disabled}
      bind:checked
      class="visually-hidden"
    />
  </div>
</div>

<style>
  :global(:root) {
    --spacing-small: 8px;
    --spacing-medium: 16px;
    --font-size-normal: 16px;
    --icon-color: #666;
  }

  .toggle-component {
    display: flex;
    align-items: center;
    margin-bottom: var(--spacing-medium); /* Consistent spacing */
    gap: var(--spacing-small);
  }

  .toggle-label {
    font-size: var(--font-size-normal);
    color: var(--text-color-primary);
    cursor: pointer;
    user-select: none; /* Prevent text selection on click */
  }

  .toggle-label.disabled {
    color: var(--text-color-disabled);
    cursor: not-allowed;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
  }

  .toggle-switch-container {
    position: relative;
    display: inline-block; /* Allows label and switch to align nicely */
  }
</style>
