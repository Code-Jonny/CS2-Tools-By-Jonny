<script setup lang="ts">
  import { onMounted, onUnmounted, ref } from 'vue';
  import { listen } from '@tauri-apps/api/event';
  import { settings } from "@lib/settingsStore";
  import Icon from "@icons/Icon.vue";
  import Card from "@elements/Card.vue";
  import Toggle from "@elements/Toggle.vue";

  const gsiData = ref<any>(null);
  let unlistenGSI: (() => void) | null = null;

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
            CT {{ gsiData.map?.team_ct?.score || 0 }} - T {{ gsiData.map?.team_t?.score || 0 }}
          </span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Player Name:</span>
          <span class="stat-value">{{ gsiData.player?.name || 'N/A' }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Kills / Deaths:</span>
          <span class="stat-value">
            {{ gsiData.player?.match_stats?.kills || 0 }} / {{ gsiData.player?.match_stats?.deaths || 0 }}
          </span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Health:</span>
          <span class="stat-value">{{ gsiData.player?.state?.health || 0 }} HP</span>
        </div>
      </div>
      <p v-else class="info-text">Waiting for CS2 Game State...</p>
    </Card>

    <Card title="GSI Features" icon="settings">
      <div class="settings-section">
        <div class="setting-item">
          <Toggle label="Bomb Timer Notifications" id="bombTimerEnabled" v-model:checked="settings.bombTimerEnabled" />
        </div>
      </div>
    </Card>
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
