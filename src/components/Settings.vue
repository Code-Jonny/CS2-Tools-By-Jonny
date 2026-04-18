<script setup lang="ts">
  import { settings } from "@lib/settingsStore";
  import { onMounted, watch, ref } from "vue";
  import Button from "@elements/Button.vue";
  import Toggle from "@elements/Toggle.vue";
  import Card from "@elements/Card.vue";
  import { setAutostart, checkAutostartStatus } from "@lib/startupUtils";
  import { logInfo, logError } from "@lib/logger";
  import { defaultAppSettings } from "@lib/settingsStore";
  import { confirm } from '@tauri-apps/plugin-dialog';

  const autostartError = ref<string | null>(null);
  const isInitialized = ref(false);

  const resetToDefaults = async () => {
    Object.assign(settings, JSON.parse(JSON.stringify(defaultAppSettings)));
  };

  onMounted(async () => {
    try {
      const registryAutostartStatus = await checkAutostartStatus();
      if (settings.autostartWithWindows !== registryAutostartStatus) {
        logInfo(
          `Autostart mismatch onMount: Store is ${settings.autostartWithWindows}, Registry is ${registryAutostartStatus}. Syncing store to registry.`
        );
        settings.autostartWithWindows = registryAutostartStatus;
      }
    } catch (error) {
      logError("Error checking autostart status on mount:", error);
      autostartError.value = "Could not verify autostart status.";
    }
    isInitialized.value = true;
  });

  watch(() => settings.autostartWithWindows, async (newValue, oldValue) => {
    if (!isInitialized.value) return;
    if (newValue === oldValue) return;

    try {
      logInfo(`Autostart setting changed to: ${newValue} (post-init). Updating registry.`);
      await setAutostart(newValue);
      autostartError.value = null;
    } catch (error: any) {
      logError("Error updating autostart setting (post-init):", error);
      autostartError.value = `Failed to update autostart: ${error.message || "Unknown error"}`;
    }
  });

  async function handleResetToDefaults() {
    const userConfirmed = await confirm("Are you sure you want to reset all settings to default values?", { kind: "warning" });
    if (userConfirmed) {
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
        <Toggle label="Minimize to System Tray instead of taskbar"
                id="minimizeToTray" v-model:checked="settings.minimizeToTray" />
      </div>

      <div class="setting-item">
        <Toggle label="Minimize on Close" id="minimizeOnClose"
                v-model:checked="settings.minimizeOnClose" />
      </div>

      <div class="setting-item">
        <Toggle label="Enable Debug Log (not functioning at the moment)"
                id="enableDebugLog" v-model:checked="settings.enableDebugLog" />
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
