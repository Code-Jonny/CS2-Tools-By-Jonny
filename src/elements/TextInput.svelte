<script lang="ts">
  import Icon from "@iconify/svelte"; // Import Icon component

  // Define types for props
  type InputMode =
    | "none"
    | "text"
    | "decimal"
    | "numeric"
    | "tel"
    | "search"
    | "email"
    | "url";

  interface Props {
    label?: string;
    id?: string; // Input element's id, also used for label's for attribute
    name?: string;
    value?: string; // Bindable value
    inputmode?: InputMode;
    placeholder?: string;
    error?: string | null;
    icon?: string;
    iconSize?: string;

    // Event callbacks to replace dispatched events
    oninput?: (event: Event) => void;
    onchange?: (event: Event) => void;
    onblur?: (event: FocusEvent) => void;
    onsubmit?: () => void; // For Enter key press
  }

  // Define props using Svelte 5 $props
  let {
    label,
    id: propId, // Renamed to avoid conflict with the const uniqueId
    name,
    inputmode = "text",
    placeholder,
    error,
    value = $bindable(""), // Ensures 'value' is a signal, defaulting to ""
    icon,
    iconSize = "20",
    oninput: onInputCallback,
    onchange: onChangeCallback,
    onblur: onBlurCallback,
    onsubmit: onSubmitCallback,
  }: Props = $props(); // Changed: Type assertion on the destructured object

  function handleInput(event: Event) {
    // The `value` signal is automatically updated by `bind:value` on the <input> element.
    // Call the callback prop if provided.
    if (onInputCallback) {
      onInputCallback(event);
    }
  }

  function handleChange(event: Event) {
    if (onChangeCallback) {
      onChangeCallback(event);
    }
  }

  function handleBlur(event: FocusEvent) {
    if (onBlurCallback) {
      onBlurCallback(event);
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevent default form submission if any
      if (onSubmitCallback) {
        onSubmitCallback();
      }
    }
  }

  // Generate a unique ID if propId (the passed 'id' prop) is not provided, for label association
  const uniqueId =
    propId || `text-input-${Math.random().toString(36).substring(2, 9)}`;
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
      bind:value
      type={inputmode === "numeric" || inputmode === "decimal"
        ? "number"
        : "text"}
      id={uniqueId}
      name={name || uniqueId}
      oninput={handleInput}
      onchange={handleChange}
      onblur={handleBlur}
      onkeydown={handleKeyDown}
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

  /* .input-icon {
    position: absolute;
    left: 12px;
    color: var(--text-secondary);
    pointer-events: none;
  } */

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
