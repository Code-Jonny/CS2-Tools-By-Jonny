<script lang="ts">
  import { createEventDispatcher } from "svelte";

  /** The label text for the input field. */
  export let label: string;

  /** The unique ID for the input field and the `for` attribute of the label. */
  export let id: string;

  /** The name attribute for the input field. */
  export let name: string;

  /** The current value of the input field. Should be a string, controlled by the parent. */
  export let value: string;

  /** The minimum value allowed (for validation, passed to input). */
  export let min: string | undefined = undefined;

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
    | undefined = undefined;

  /** The placeholder text for the input field. */
  export let placeholder: string | undefined = undefined;

  /** An error message to display below the input. Null or undefined hides it. */
  export let error: string | null | undefined = undefined;

  const dispatch = createEventDispatcher<{
    input: Event; // Forward native input event
    change: Event; // Forward native change event
    blur: FocusEvent; // Forward native blur event
  }>();

  // Renamed for clarity and to emphasize it handles the native event
  function onNativeInput(event: Event) {
    // The 'value' prop is controlled by the parent.
    // This component should not mutate its 'value' prop directly.
    // It dispatches an event, and the parent updates the prop.
    dispatch("input", event);
  }

  // Renamed for clarity
  function onNativeChange(event: Event) {
    dispatch("change", event);
  }

  // Renamed for clarity
  function onNativeBlur(event: FocusEvent) {
    dispatch("blur", event);
  }
</script>

<div class="text-input-container">
  <label for={id}>{label}</label>
  <input
    type="text"
    {id}
    {name}
    {value}
    on:input={onNativeInput}
    on:change={onNativeChange}
    on:blur={onNativeBlur}
    {min}
    {inputmode}
    {placeholder}
    aria-invalid={error ? true : undefined}
    class:invalid={error}
  />
  {#if error}
    <p class="error-message">{error}</p>
  {/if}
</div>

<style scoped>
  .text-input-container {
    width: 100%; /* Ensure the container takes full width */
    margin-bottom: 10px; /* Spacing below the component */
  }

  label {
    display: block;
    margin-bottom: 5px; /* Space between label and input */
    font-weight: 500;
    font-size: 0.95em;
  }

  input[type="text"] {
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box;
    font-size: 1em;
  }

  input[type="text"].invalid {
    border-color: red;
  }

  input[type="text"]:focus {
    border-color: var(
      --neutralino-colors-accent,
      #007bff
    ); /* Use theme color if available */
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25); /* Example focus style */
  }

  .error-message {
    color: red;
    font-size: 0.875em;
    margin-top: 4px;
  }
</style>
