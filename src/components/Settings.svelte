<script lang="ts">
  // Import the reactive settings store and the reset function
  import { settings, resetToDefaults } from "@lib/settingsStore.svelte.ts";
  import { onMount } from "svelte";
  import Button from "@elements/Button.svelte";
  import Toggle from "@elements/Toggle.svelte"; // Import the Toggle component

  // Local state for polling interval in seconds for the input field
  let pollingIntervalSeconds: number = $state(
    settings.pollingIntervalMs / 1000
  );
  let pollingIntervalError: string | null = $state(null);

  function handlePollingIntervalChange(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const rawValue = inputElement.value;
    // Replace comma with dot to ensure consistent parsing and allow comma input
    const valueWithDot = rawValue.replace(",", ".");
    const value = parseFloat(valueWithDot);

    if (isNaN(value) || value < 0.1) {
      pollingIntervalError =
        "Polling interval must be a valid number (e.g., 0.5) and at least 0.1 seconds. Use a dot as the decimal separator.";
      // Do not update state if input is invalid
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
  <h2>General Settings</h2>
  <form onsubmit={(e) => e.preventDefault()}>
    <Toggle
      label="Autostart with Windows"
      id="autostartWithWindows"
      name="autostartWithWindows"
      checked={settings.autostartWithWindows}
      checkedChanged={(newVal) => (settings.autostartWithWindows = newVal)}
    />

    <Toggle
      label="Start Minimized"
      id="startMinimized"
      name="startMinimized"
      checked={settings.startMinimized}
      checkedChanged={(newVal) => (settings.startMinimized = newVal)}
    />

    <div>
      <label for="pollingInterval">Polling Interval (seconds)</label>
      <input
        type="text"
        id="pollingInterval"
        name="pollingInterval"
        value={pollingIntervalSeconds}
        oninput={handlePollingIntervalChange}
        min="0.1"
        inputmode="decimal"
      />
      {#if pollingIntervalError}
        <p style="color: red; font-size: 0.9em;">{pollingIntervalError}</p>
      {/if}
    </div>

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
  label {
    display: block;
    margin-top: 10px;
  }
  input[type="text"] {
    /* Style for text input */
    width: 100%;
    padding: 8px;
    margin-top: 5px;
    margin-bottom: 5px; /* Reduced bottom margin to make space for error message */
    box-sizing: border-box;
  }
</style>
