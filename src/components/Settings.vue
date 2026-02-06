<script setup lang="ts">
  import { settings } from "@lib/settingsStore";
  import { onMounted, watch, ref } from "vue";
  import Button from "@elements/Button.vue";
  import Toggle from "@elements/Toggle.vue";
  import TextInput from "@elements/TextInput.vue";
  import Card from "@elements/Card.vue";
  import { setAutostart, checkAutostartStatus } from "@lib/startupUtils";
  import { devLog, devError } from "@lib/logger";
  import { defaultAppSettings } from "@lib/settingsStore"; // Need to export reset logic or implement it here

  // We need a reset function. The old file imported `resetToDefaults` from `settingsStore`.
  // I didn't export `resetToDefaults` in `settingsStore.ts`. I should fix that or implement it here.
  // I'll implement it here or adding it to settingsStore is better.
  // For now, I'll implement a reset function here that resets the reactive object.

  const pollingIntervalSeconds = ref(settings.pollingIntervalMs / 1000);
  const pollingIntervalError = ref<string | null>(null);
  const autostartError = ref<string | null>(null);
  const isInitialized = ref(false);

  const resetToDefaults = async () => {
    Object.assign(settings, JSON.parse(JSON.stringify(defaultAppSettings)));
    // Also clear persistence? The watcher will handle saving the new defaults.
  };

  onMounted(async () => {
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
      autostartError.value = "Could not verify autostart status.";
    }
    isInitialized.value = true;
  });

  watch(() => settings.autostartWithWindows, async (newValue, oldValue) => {
    if (!isInitialized.value) return;
    if (newValue === oldValue) return;

    try {
      devLog(`Autostart setting changed to: ${newValue} (post-init). Updating registry.`);
      await setAutostart(newValue);
      autostartError.value = null;
    } catch (error: any) {
      devError("Error updating autostart setting (post-init):", error);
      autostartError.value = `Failed to update autostart: ${error.message || "Unknown error"}`;
      // Revert setting if failed?? Svelte code didn't revert but showed error.
    }
  });

  function handlePollingIntervalChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const valStr = input.value.replace(",", ".");
    const val = parseFloat(valStr);

    if (isNaN(val) || val < 1) {
      pollingIntervalError.value = "Polling interval must be a valid number (e.g., 3.5) and at least 1 second.";
      return;
    }

    pollingIntervalError.value = null;
    pollingIntervalSeconds.value = val;
    settings.pollingIntervalMs = Math.round(val * 1000);
  }

  // Sync back if store changes (e.g. reset)
  watch(() => settings.pollingIntervalMs, (newMs) => {
    const newSec = newMs / 1000;
    if (pollingIntervalSeconds.value !== newSec) {
      pollingIntervalSeconds.value = newSec;
      pollingIntervalError.value = null;
    }
  });

  async function handleResetToDefaults() {
    if (confirm("Are you sure you want to reset all settings to default values?")) {
      await resetToDefaults();
    }
  }
</script>

<template>
  <div class="settings-container">
    <h1>Settings</h1>

    <Card title="Startup & Behavior" icon="settings">
      <div class="setting-item">
        <Toggle label="Start with Windows" id="autostart"
                v-model:checked="settings.autostartWithWindows" />
        <p v-if="autostartError" class="error-text">{{ autostartError }}</p>
      </div>

      <div class="setting-item">
        <Toggle label="Start Minimized" id="startMinimized"
                v-model:checked="settings.startMinimized" />
      </div>

      <div class="setting-item">
        <Toggle label="Minimize to System Tray on Close" id="minimizeToTray"
                v-model:checked="settings.minimizeToTray" />
      </div>
    </Card>

    <Card title="Application Performance" icon="graph-up">
      <div class="setting-item">
        <TextInput label="Polling Interval (seconds)" id="pollingInterval"
                   :modelValue="pollingIntervalSeconds.toString()"
                   @input="handlePollingIntervalChange" placeholder="e.g. 5.0"
                   :error="pollingIntervalError || undefined" />
        <p class="help-text">How often the app checks for CS2 status.</p>
      </div>
    </Card>

    <div class="danger-zone">
      <h3>Danger Zone</h3>
      <Button variant="danger" @click="handleResetToDefaults"
              icon="solar:restart-circle-linear">
        Reset All Settings
      </Button>
    </div>
  </div>
</template>

<style scoped>
  .settings-container {
    display: flex;
    flex-direction: column;
    gap: 25px;
  }

  .setting-item {
    margin-bottom: 20px;
  }

  .setting-item:last-child {
    margin-bottom: 0;
  }

  .help-text {
    color: var(--text-secondary);
    font-size: 13px;
    margin-top: 5px;
  }

  .error-text {
    color: var(--error-color);
    font-size: 13px;
    margin-top: 5px;
  }

  .danger-zone {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid var(--background-secondary);
  }

  .danger-zone h3 {
    color: var(--error-color);
    margin-bottom: 15px;
  }
</style>
