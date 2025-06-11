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
      class:input-with-icon={icon}
      aria-invalid={error ? "true" : undefined}
      aria-describedby={error ? `${uniqueId}-error` : undefined}
    />
  </div>
  {#if error}
    <p id={`${uniqueId}-error`} class="error-message" aria-live="polite">
      {error}
    </p>
  {/if}
</div>

<style>
  .text-input-wrapper {
    display: flex;
    flex-direction: column;
    gap: 5px; /* Space between label and input, and input and error */
    width: 100%; /* Ensure wrapper takes full width */
  }

  .input-label {
    font-size: 14px; /* Consistent label size */
    color: var(--text-secondary);
    font-weight: 500; /* Medium weight for labels */
  }

  .input-container {
    position: relative; /* For icon positioning */
    display: flex; /* Align icon and input */
    align-items: center;
    width: 100%; /* Ensure container takes full width */
    gap: 10px; /* Space between icon and input */
  }

  input {
    flex-grow: 1; /* Make input field take available space */
    padding: 10px;
    border: 1px solid var(--border-color, #ccc);
    border-radius: var(--input-border-radius, 4px);
    font-size: 16px;
    color: var(--text-primary);
    background-color: var(--input-background, #444);
    transition:
      border-color 0.2s ease-in-out,
      box-shadow 0.2s ease-in-out;
    width: 100%; /* Fallback for older browsers or if flex-grow isn't enough */
    box-sizing: border-box; /* Include padding and border in the element's total width and height */
  }

  input.input-with-icon {
    padding-left: 35px; /* Adjust to make space for the icon */
  }

  input:focus {
    border-color: var(--primary-accent, #007bff);
    box-shadow: 0 0 0 2px rgba(var(--primary-accent-rgb, 0, 123, 255), 0.25);
    outline: none;
  }

  input[aria-invalid="true"] {
    border-color: var(--error-color, #dc3545);
  }

  input[aria-invalid="true"]:focus {
    box-shadow: 0 0 0 2px rgba(var(--error-color-rgb, 220, 53, 69), 0.25);
  }

  .error-message {
    font-size: 12px;
    color: var(--error-color, #dc3545);
    margin-top: 4px; /* Space above the error message */
  }
</style>
