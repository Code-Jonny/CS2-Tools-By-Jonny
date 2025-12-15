<script lang="ts">
  // Import the reactive settings store and the reset function
  import { settings, resetToDefaults } from "@lib/settingsStore.svelte.ts";
  import { onMount } from "svelte";
  import Button from "@elements/Button.svelte";
  import Toggle from "@elements/Toggle.svelte"; // Import the Toggle component
  import TextInput from "@elements/TextInput.svelte"; // Import the TextInput component
  import Card from "@elements/Card.svelte"; // Import the Card component
  import { setAutostart, checkAutostartStatus } from "@lib/startupUtils.ts";
  import { devLog, devError } from "@lib/logger.ts"; // Import the logger

  // Local state for polling interval in seconds for the input field
  let pollingIntervalSeconds: number = $state(
    settings.pollingIntervalMs / 1000
  );
  let pollingIntervalError: string | null = $state(null);
  let autostartError: string | null = $state(null);
  let isInitialized = false; // Flag to prevent effect from running during onMount sync

  onMount(async () => {
    try {
      const registryAutostartStatus = await checkAutostartStatus();
      if (settings.autostartWithWindows !== registryAutostartStatus) {
        devLog(
          `Autostart mismatch onMount: Store is ${settings.autostartWithWindows}, Registry is ${registryAutostartStatus}. Syncing store to registry.`
        );
        settings.autostartWithWindows = registryAutostartStatus;
      }
    } catch (error) {
      devError("Error checking autostart status on mount:", error);
      autostartError = "Could not verify autostart status.";
    }
    isInitialized = true; // Signal that onMount synchronization is complete
  });

  $effect(() => {
    const currentAutostartSetting = settings.autostartWithWindows;

    if (!isInitialized) {
      // Don't run if not initialized yet
      return;
    }

    // At this point, isInitialized is true, so any change to settings.autostartWithWindows
    // is considered a user action or a deliberate programmatic change post-initialization.
    (async () => {
      try {
        devLog(
          `Autostart setting changed to: ${currentAutostartSetting} (post-init). Updating registry.`
        );
        await setAutostart(currentAutostartSetting);
        autostartError = null; // Clear any previous error
      } catch (error) {
        devError("Error updating autostart setting (post-init):", error);
        if (error instanceof Error) {
          autostartError = `Failed to update autostart: ${error.message}`;
        } else {
          autostartError = "Failed to update autostart: Unknown error";
        }
      }
    })();
  });

  function handlePollingIntervalChange(event: Event) {
    if (!event || !(event.target instanceof HTMLInputElement)) {
      devError(
        "Polling interval input event: event.target is not an HTMLInputElement or is null.",
        event ? event.target : "event is null"
      );
      return;
    }
    const inputElement = event.target as HTMLInputElement; // Directly use event.target
    const rawValue = inputElement.value;
    // Replace comma with dot to ensure consistent parsing and allow comma input
    const valueWithDot = rawValue.replace(",", ".");
    const value = parseFloat(valueWithDot);

    if (isNaN(value) || value < 1) {
      pollingIntervalError =
        "Polling interval must be a valid number (e.g., 3.5) and at least 1 second. Use a dot as the decimal separator.";
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
        devError("Error resetting settings:", error);
        alert("Failed to reset settings.");
      }
    }
  }
</script>

<div class="settings-container">
  <h1>Settings</h1>
  <Card title="Application Start Behavior" icon="solar:rocket-bold">
    <div class="togglelist">
      <Toggle
        label="Autostart with Windows"
        id="autostartWithWindows"
        name="autostartWithWindows"
        bind:checked={settings.autostartWithWindows}
      />
      {#if autostartError}
        <p class="error-text">{autostartError}</p>
      {/if}

      <Toggle
        label="Start Minimized"
        id="startMinimized"
        name="startMinimized"
        bind:checked={settings.startMinimized}
      />
    </div>
  </Card>

  <Card title="Performance" icon="solar:cpu-bolt-bold">
    <TextInput
      label="Polling Interval (seconds)"
      id="pollingInterval"
      name="pollingInterval"
      value={pollingIntervalSeconds.toString()}
      oninput={handlePollingIntervalChange}
      inputmode="decimal"
      error={pollingIntervalError}
      placeholder="e.g., 1.5"
    />
  </Card>

  <Card title="Reset to Defaults" icon="solar:refresh-circle-bold">
    <Button
      type="button"
      onclick={handleResetToDefaults}
      style="margin-top: 15px;"
    >
      Reset to Defaults
    </Button>
  </Card>

  <hr />
  <h3>Current General Settings (Live View from Store)</h3>
  <p>Autostart with Windows: {settings.autostartWithWindows}</p>
  <p>Start Minimized: {settings.startMinimized}</p>
  <p>
    Polling Interval: {settings.pollingIntervalMs / 1000} seconds ({settings.pollingIntervalMs}ms)
  </p>
</div>

<style scoped>
  .settings-container {
    display: flex;
    flex-direction: column;
    gap: 25px; /* Spacing between cards */
  }
  .togglelist {
    display: flex;
    flex-direction: column;
    gap: 20px; /* Spacing between toggle items */
  }
  .error-text {
    color: var(--color-error); /* Use CSS variable for error color */
    font-size: 0.9em;
  }
</style>
