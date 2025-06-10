<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import Icon from "@iconify/svelte"; // Import Icon component

  /** The label text for the input field. Optional, can be hidden if not provided. */
  export let label: string | undefined = undefined;

  /** The unique ID for the input field and the `for` attribute of the label. Required if label is present. */
  export let id: string | undefined = undefined;

  /** The name attribute for the input field. */
  export let name: string | undefined = undefined; // Optional, but good practice

  /** The current value of the input field. Should be a string, controlled by the parent. */
  export let value: string = ""; // Initialize to empty string

  /** The inputmode attribute for the input field. */
  export let inputmode:
    | "none"
    | "text"
    | "decimal"
    | "numeric"
    | "tel"
    | "search"
    | "email"
    | "url"
    | undefined = "text"; // Default to text

  /** The placeholder text for the input field. */
  export let placeholder: string | undefined = undefined;

  /** An error message to display below the input. Null or undefined hides it. */
  export let error: string | null | undefined = undefined;

  /** Icon to display inside the input field (typically on the left). */
  export let icon: string | undefined = undefined;
  /** Icon size */
  export let iconSize: string = "20";

  const dispatch = createEventDispatcher<{
    input: Event; // Forward native input event
    change: Event; // Forward native change event
    blur: FocusEvent; // Forward native blur event
    // Add focus if needed
  }>();

  function onNativeInput(event: Event) {
    const target = event.target as HTMLInputElement;
    value = target.value; // Update the bound value
    dispatch("input", event);
  }

  function onNativeChange(event: Event) {
    dispatch("change", event);
  }

  function onNativeBlur(event: FocusEvent) {
    dispatch("blur", event);
  }

  // Generate a unique ID if not provided, for label association
  const uniqueId =
    id || `text-input-${Math.random().toString(36).substring(2, 9)}`;
</script>

<div class="text-input-wrapper">
  {#if label}
    <label for={uniqueId} class="input-label">{label}</label>
  {/if}
  <div class="input-container" class:has-icon={icon}>
    {#if icon}
      <Icon {icon} width={iconSize} height={iconSize} class="input-icon" />
    {/if}
    <input
      type={inputmode === "numeric" || inputmode === "decimal"
        ? "number"
        : "text"}
      id={uniqueId}
      name={name || uniqueId}
      bind:value
      on:input={onNativeInput}
      on:change={onNativeChange}
      on:blur={onNativeBlur}
      {inputmode}
      {placeholder}
      aria-invalid={error ? true : undefined}
      class="styled-input"
      class:invalid={error}
      class:with-icon={icon}
    />
  </div>
  {#if error}
    <p class="error-text">{error}</p>
  {/if}
</div>

<style scoped>
  .text-input-wrapper {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 6px; /* Space between label, input, error */
  }

  .input-label {
    font-size: 14px; /* Labels & Captions */
    font-weight: 500; /* Inter Medium */
    color: var(--text-secondary);
  }

  .input-container {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
  }

  .input-icon {
    position: absolute;
    left: 12px;
    color: var(--text-secondary);
    pointer-events: none; /* So it doesn't interfere with input click */
  }

  .styled-input {
    width: 100%;
    padding: 10px;
    background-color: var(--background-primary);
    color: var(--text-primary);
    border: 1px solid var(--text-secondary);
    border-radius: var(--window-corner-radius, 4px);
    font-size: 16px; /* Body Text */
    font-family: var(--font-family-inter);
    transition:
      border-color 0.2s ease-in-out,
      box-shadow 0.2s ease-in-out;
  }

  .styled-input.with-icon {
    padding-left: 40px; /* Make space for the icon */
  }

  .styled-input:focus {
    outline: none;
    border-color: var(--primary-accent);
    box-shadow: 0 0 0 2px rgba(var(--primary-accent-rgb, 0, 191, 255), 0.3);
  }

  .styled-input.invalid {
    border-color: var(--error-color);
  }
  .styled-input.invalid:focus {
    box-shadow: 0 0 0 2px rgba(var(--error-color-rgb, 220, 53, 69), 0.3);
  }

  .error-text {
    font-size: 14px;
    color: var(--error-color);
    margin-top: 2px; /* Smaller gap */
  }
</style>
