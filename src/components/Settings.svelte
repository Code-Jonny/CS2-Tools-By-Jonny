<script lang="ts">
  // Import the reactive settings store and the reset function
  import { settings, resetToDefaults } from "@lib/settingsStore.svelte.ts";
  import { onMount } from "svelte";
  import Button from "@elements/Button.svelte";
  import Toggle from "@elements/Toggle.svelte"; // Import the Toggle component
  import TextInput from "@elements/TextInput.svelte"; // Import the TextInput component

  // Local state for polling interval in seconds for the input field
  let pollingIntervalSeconds: number = $state(
    settings.pollingIntervalMs / 1000
  );
  let pollingIntervalError: string | null = $state(null);

  function handlePollingIntervalChange(customEvent: CustomEvent<Event>) {
    const nativeEvent = customEvent.detail;
    if (!nativeEvent || !(nativeEvent.target instanceof HTMLInputElement)) {
      console.error(
        "Polling interval input event: nativeEvent.target is not an HTMLInputElement or is null.",
        nativeEvent ? nativeEvent.target : "nativeEvent is null"
      );
      return;
    }
    const inputElement = nativeEvent.target as HTMLInputElement;
    const rawValue = inputElement.value;
    // Replace comma with dot to ensure consistent parsing and allow comma input
    const valueWithDot = rawValue.replace(",", ".");
    const value = parseFloat(valueWithDot);

    if (isNaN(value) || value < 1) {
      pollingIntervalError =
        "Polling interval must be a valid number (e.g., 3.5) and at least 1 second. Use a dot as the decimal separator.";
      // Do not update state if input is invalid
      // Ensure the input field reflects the last valid 'pollingIntervalSeconds' or the store value if it's the first invalid entry.
      // This assignment is crucial to revert the visual input if the user types something invalid.
      // For example, if it was '5' and user types 'abc', it should revert to '5'.
      // The `value` prop of TextInput will be bound to `pollingIntervalSeconds`
      // To ensure the input field visually reverts, we might need to re-assign pollingIntervalSeconds
      // to itself if the component doesn't automatically re-render with the old value.
      // However, since `value` is bound to `pollingIntervalSeconds.toString()`, and `pollingIntervalSeconds`
      // is not changed here, the input should retain its previous valid state or the store's initial state.
      return;
    }

    pollingIntervalError = null;
    pollingIntervalSeconds = value; // Keep local state in seconds
    settings.pollingIntervalMs = Math.round(value * 1000); // Update store in milliseconds
  }

  // Synchronize local pollingIntervalSeconds when settings.pollingIntervalMs changes from outside
  // (e.g., after resetToDefaults or initial load)
  $effect(() => {
    const storeValueInSeconds = settings.pollingIntervalMs / 1000;
    if (pollingIntervalSeconds !== storeValueInSeconds) {
      pollingIntervalSeconds = storeValueInSeconds;
      pollingIntervalError = null; // Clear error if store changes
    }
  });

  async function handleResetToDefaults() {
    if (
      confirm("Are you sure you want to reset all settings to their defaults?")
    ) {
      try {
        await resetToDefaults();
        // pollingIntervalSeconds will be updated by the $effect above
        alert("Settings have been reset to defaults.");
      } catch (error) {
        console.error("Error resetting settings:", error);
        alert("Failed to reset settings.");
      }
    }
  }
</script>

<div class="container">
  <h1>General Settings</h1>
  <form onsubmit={(e) => e.preventDefault()}>
    <Toggle
      label="Autostart with Windows"
      id="autostartWithWindows"
      name="autostartWithWindows"
      bind:checked={settings.autostartWithWindows}
    />

    <Toggle
      label="Start Minimized"
      id="startMinimized"
      name="startMinimized"
      bind:checked={settings.startMinimized}
    />

    <TextInput
      label="Polling Interval (seconds)"
      id="pollingInterval"
      name="pollingInterval"
      value={pollingIntervalSeconds.toString()}
      on:input={handlePollingIntervalChange}
      inputmode="decimal"
      error={pollingIntervalError}
      placeholder="e.g., 1.5"
    />

    <Button
      type="button"
      onclick={handleResetToDefaults}
      style="margin-top: 15px;"
    >
      Reset to Defaults
    </Button>
  </form>

  <hr />
  <h3>Current General Settings (Live View from Store)</h3>
  <p>Autostart with Windows: {settings.autostartWithWindows}</p>
  <p>Start Minimized: {settings.startMinimized}</p>
  <p>
    Polling Interval: {settings.pollingIntervalMs / 1000} seconds ({settings.pollingIntervalMs}ms)
  </p>
</div>

<style scoped>
  hr {
    margin-top: 20px;
    margin-bottom: 20px;
  }
  .container {
    /* Add any specific styles for this component if needed */
  }
  /* Removed label and input[type="text"] styles as TextInput handles them */
</style>
