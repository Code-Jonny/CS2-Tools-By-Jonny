<script setup lang="ts">
  import { settings } from "@lib/settingsStore";
  import { onMounted, watch, ref } from "vue";
  import Button from "@elements/Button.vue";
  import Toggle from "@elements/Toggle.vue";
  import Card from "@elements/Card.vue";
  import TextInput from "@elements/TextInput.vue";
  import { setAutostart, checkAutostartStatus } from "@lib/startupUtils";
  import { logInfo, logError } from "@lib/logger";
  import { defaultAppSettings } from "@lib/settingsStore";
  import { confirm, open } from "@tauri-apps/plugin-dialog";
  import { invoke } from "@tauri-apps/api/core";

  const autostartError = ref<string | null>(null);
  const isInitialized = ref(false);

  const gsiError = ref<string | null>(null);
  const gsiSuccess = ref<string | null>(null);
  const gsiLoadingAutoDetect = ref(false);
  const gsiLoadingBrowse = ref(false);
  const gsiLoadingApply = ref(false);

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

  async function handleAutoDetectCs2Path() {
    gsiError.value = null;
    gsiSuccess.value = null;
    gsiLoadingAutoDetect.value = true;
    try {
      const detectedPath = await invoke<string>("auto_detect_cs2_path");
      settings.cs2Path = detectedPath;
      gsiSuccess.value = "CS2 path detected successfully.";
      logInfo(`Auto-detected CS2 path: ${detectedPath}`);
    } catch (error: any) {
      const errorMsg = error.message || String(error) || "Failed to auto-detect CS2 path.";
      logError("Error auto-detecting CS2 path:", error);
      gsiError.value = errorMsg;
    } finally {
      gsiLoadingAutoDetect.value = false;
    }
  }

  async function handleBrowseCs2Path() {
    gsiError.value = null;
    gsiSuccess.value = null;
    gsiLoadingBrowse.value = true;
    try {
      const selected = await open({
        directory: true,
        title: "Select CS2 Installation Folder",
      });
      if (selected && typeof selected === "string") {
        settings.cs2Path = selected;
        gsiSuccess.value = "Folder selected successfully.";
        logInfo(`CS2 path selected: ${selected}`);
      }
    } catch (error: any) {
      const errorMsg = error.message || String(error) || "Failed to browse folder.";
      logError("Error browsing CS2 path:", error);
      gsiError.value = errorMsg;
    } finally {
      gsiLoadingBrowse.value = false;
    }
  }

  async function handleApplyGsiConfig() {
    gsiError.value = null;
    gsiSuccess.value = null;

    if (!settings.cs2Path) {
      gsiError.value = "CS2 installation path is not set. Please set it first.";
      return;
    }

    gsiLoadingApply.value = true;
    try {
      await invoke("install_gsi_config", { cs2Path: settings.cs2Path });
      gsiSuccess.value = "GSI configuration applied successfully.";
      logInfo(`GSI config applied to: ${settings.cs2Path}`);
    } catch (error: any) {
      const errorMsg = error.message || String(error) || "Failed to apply GSI configuration.";
      logError("Error applying GSI config:", error);
      gsiError.value = errorMsg;
    } finally {
      gsiLoadingApply.value = false;
    }
  }
</script>

<template>
  <div class="settings-container">
    <h1>Settings</h1>

    <Card title="CS2 Integration (GSI)" icon="settings">
      <div class="setting-item">
        <p class="section-description">
          Configure Game State Integration (GSI) to enable real-time game data
          access and advanced monitoring features.
        </p>
      </div>

      <div class="setting-item">
        <Toggle label="Enable Game State Integration" id="gsiEnabled"
                v-model:checked="settings.gsiEnabled" />
      </div>

      <div class="setting-item">
        <label for="cs2Path" class="input-label">CS2 Installation Path</label>
        <TextInput id="cs2Path" v-model="settings.cs2Path"
                   placeholder="C:\Program Files (x86)\Steam\steamapps\common\Counter-Strike Global Offensive" />
        <p v-if="gsiError" class="error-text">{{ gsiError }}</p>
        <p v-if="gsiSuccess" class="success-text">{{ gsiSuccess }}</p>
      </div>

      <div class="setting-item buttons-row">
        <Button variant="secondary" @click="handleAutoDetectCs2Path"
                :disabled="gsiLoadingAutoDetect">
          {{ gsiLoadingAutoDetect ? "Detecting..." : "Find Automatically" }}
        </Button>
        <Button variant="secondary" @click="handleBrowseCs2Path"
                :disabled="gsiLoadingBrowse">
          {{ gsiLoadingBrowse ? "Browsing..." : "Browse" }}
        </Button>
      </div>

      <div class="setting-item">
        <Button variant="primary" @click="handleApplyGsiConfig"
                :disabled="gsiLoadingApply || !settings.cs2Path">
          {{ gsiLoadingApply ? "Applying..." : "Apply GSI Config" }}
        </Button>
      </div>
    </Card>

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
      <Button variant="danger" @click="handleResetToDefaults">
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

  .success-text {
    color: var(--success-color, #28a745);
    font-size: 13px;
    margin-top: 5px;
  }

  .section-description {
    color: var(--text-secondary);
    font-size: 14px;
    margin-bottom: 15px;
    line-height: 1.5;
  }

  .input-label {
    display: block;
    color: var(--text-primary);
    font-size: 14px;
    margin-bottom: 8px;
    font-weight: 500;
  }

  .buttons-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
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
