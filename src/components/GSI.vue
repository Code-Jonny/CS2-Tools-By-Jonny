<script setup lang="ts">
  import { onMounted, onUnmounted, ref } from 'vue';
  import { listen } from '@tauri-apps/api/event';
  import { settings } from "@lib/settingsStore";
  import Icon from "@icons/Icon.vue";
  import Card from "@elements/Card.vue";
  import Toggle from "@elements/Toggle.vue";
  import ContentBox from "@elements/ContentBox.vue";
  import TextInput from "@elements/TextInput.vue";
  import Button from "@elements/Button.vue";
  import HelpCard from "@elements/HelpCard.vue";
  import { open } from "@tauri-apps/plugin-dialog";
  import { invoke } from "@tauri-apps/api/core";
  import { logInfo, logError } from "@lib/logger";

  const gsiData = ref<any>(null);
  let unlistenGSI: (() => void) | null = null;

  const gsiError = ref<string | null>(null);
  const gsiSuccess = ref<string | null>(null);
  const gsiLoadingAutoDetect = ref(false);
  const gsiLoadingBrowse = ref(false);
  const gsiLoadingApply = ref(false);

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

  onMounted(async () => {
    unlistenGSI = await listen("gsi-update", (event) => {
      gsiData.value = event.payload;
    });
  });

  onUnmounted(() => {
    if (unlistenGSI) {
      unlistenGSI();
    }
  });
</script>

<template>
  <div class="gsi-container">
    <h1>Game State Integration (GSI)</h1>

    <ContentBox>
      <Toggle v-model:checked="settings.gsiEnabled" id="gsi-toggle"
              label="Enable Game State Integration" />
    </ContentBox>

    <template v-if="settings.gsiEnabled">
      <Card title="GSI Configuration" icon="settings">
        <div class="setting-item">
          <div>
            <label for="cs2Path" class="input-label">CS2 Installation
              Path</label>
            <p class="section-description">
              Configure the path to enable real-time game data access and
              advanced monitoring features.
            </p>
          </div>
          <div style="flex-grow: 1;">
            <TextInput id="cs2Path" v-model="settings.cs2Path"
                       placeholder="C:\Program Files (x86)\Steam\steamapps\common\Counter-Strike Global Offensive" />
            <p v-if="gsiError" class="error-text">{{ gsiError }}</p>
            <p v-if="gsiSuccess" class="success-text">{{ gsiSuccess }}</p>
          </div>
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

      <Card title="Match Status" icon="counterstrike">
        <div v-if="gsiData" class="gsi-stats">
          <div class="stat-row">
            <span class="stat-label">Map:</span>
            <span class="stat-value">{{ gsiData.map?.name || 'N/A' }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Phase:</span>
            <span class="stat-value">{{ gsiData.map?.phase || 'N/A' }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Score:</span>
            <span class="stat-value">
              CT {{ gsiData.map?.team_ct?.score || 0 }} - T
              {{ gsiData.map?.team_t?.score || 0 }}
            </span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Player Name:</span>
            <span class="stat-value">{{ gsiData.player?.name || 'N/A' }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Kills / Deaths:</span>
            <span class="stat-value">
              {{ gsiData.player?.match_stats?.kills || 0 }} /
              {{ gsiData.player?.match_stats?.deaths || 0 }}
            </span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Health:</span>
            <span class="stat-value">{{ gsiData.player?.state?.health || 0 }}
              HP</span>
          </div>
        </div>
        <p v-else class="info-text">Waiting for CS2 Game State...</p>
      </Card>

      <Card title="GSI Features" icon="settings">
        <div class="settings-section">
          <div class="setting-item">
            <Toggle label="Bomb Timer Notifications" id="bombTimerEnabled"
                    v-model:checked="settings.bombTimerEnabled" />
          </div>
          <div class="setting-item">
            <Toggle label="Bomb Timer Overlay" id="bombTimerOverlay"
                    v-model:checked="settings.bombTimerOverlay" />
          </div>
        </div>
      </Card>
    </template>

    <div v-else class="placeholder-info">
      <Icon iconName="info-circle" size="48"
            style="color: var(--text-secondary); opacity: 0.5;" />
      <p>Enable Game State Integration to access real-time game data and
        features
        like the bomb timer.</p>
    </div>
  </div>
</template>

<style scoped>
  .gsi-container {
    display: flex;
    flex-direction: column;
    gap: 25px;
  }

  h1 {
    margin-bottom: 25px;
  }

  .gsi-stats {
    margin-bottom: 20px;
  }

  .setting-item:last-child {
    margin-bottom: 0;
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

  .placeholder-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    text-align: center;
    color: var(--text-secondary);
    gap: 15px;
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
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .stat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid var(--background-secondary);
  }

  .stat-row:last-child {
    border-bottom: none;
  }

  .stat-label {
    color: var(--text-secondary);
    font-weight: 600;
    font-size: 14px;
  }

  .stat-value {
    color: var(--text-primary);
    font-size: 16px;
    font-weight: 500;
  }

  .info-text {
    color: var(--text-secondary);
    font-style: italic;
  }

  .settings-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background-color: var(--background-primary);
    border-radius: 4px;
  }
</style>
