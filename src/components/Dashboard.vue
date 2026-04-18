<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref } from 'vue';
  import { listen } from '@tauri-apps/api/event';
  import { runningProcesses, type ProcessInfo } from "@lib/runningProcesses";
  import { settings } from "@lib/settingsStore";
  import { powerPlans } from "@lib/powerplans";
  import Icon from "@icons/Icon.vue";
  import Card from "@elements/Card.vue";

  const isCS2Running = computed(() =>
    runningProcesses.processes.some(
      (p: ProcessInfo) => p?.name?.toLowerCase() === "cs2.exe"
    ) ?? false
  );

  const killListProcessStatuses = computed(() =>
    settings.processesToKill.map((processName) => ({
      name: processName,
      isRunning:
        runningProcesses.processes.some(
          (p: ProcessInfo) =>
            p?.name?.toLowerCase() === processName?.toLowerCase()
        ) ?? false,
    }))
  );

  const activePowerPlan = computed(() =>
    powerPlans.plans.find((p) => p.isActive) ?? null
  );

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
  <div class="dashboard-container">
    <h1>Dashboard</h1>

    <Card title="Counter-Strike 2 Status" icon="counterstrike">
      <div v-if="isCS2Running" class="status-indicator running">
        <Icon iconName="play-circle" size="32"
              fillColor="var(--success-color)" />
        <span>CS2 is <strong>RUNNING</strong></span>
      </div>
      <div v-else class="status-indicator not-running">
        <Icon iconName="stop-circle" size="32" fillColor="var(--error-color)" />
        <span>CS2 is <strong>NOT RUNNING</strong></span>
      </div>
    </Card>

    <Card title="Active Power Plan" icon="power">
      <p v-if="powerPlans.error" class="error-text">
        <Icon iconName="danger-triangle" size="20" />
        Error loading power plan: {{ powerPlans.error }}
      </p>
      <p v-else-if="activePowerPlan" class="status-indicator">
        {{ activePowerPlan.name }}
      </p>
      <p v-else class="info-text">No active power plan found or not loaded yet.</p>
    </Card>

    <Card v-if="settings.processManagementActive"
          title="Kill List Process Status" icon="tasks">
      <ul v-if="killListProcessStatuses.length > 0" class="process-status-list">
        <li v-for="process in killListProcessStatuses" :key="process.name">
          <span>{{ process.name }}:</span>
          <span v-if="process.isRunning"
                class="status-tag running-process">Running</span>
          <span v-else class="status-tag not-running-process">Not Running</span>
        </li>
      </ul>
      <p v-else class="info-text">No processes configured in the kill list.</p>
    </Card>

    <Card v-if="settings.gsiEnabled" title="Game State Integration (GSI)" icon="settings-2-linear">
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
  </div>
</template>

<style scoped>
  .dashboard-container {
    display: flex;
    flex-direction: column;
    gap: 25px;
  }

  h1 {
    margin-bottom: 25px;
  }

  .status-indicator {
    display: flex;
    align-items: center;
    gap: 15px;
    font-size: 18px;
  }

  .status-indicator.running {
    color: var(--success-color, #28a745);
  }

  .status-indicator.not-running {
    color: var(--error-color, #dc3545);
  }

  .error-text {
    color: var(--error-color);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .info-text {
    color: var(--text-secondary);
    font-style: italic;
  }

  .process-status-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .process-status-list li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 3px 9px;
    background-color: var(--background-primary);
    border-radius: 4px;
    font-size: 13px;
  }

  .status-tag {
    font-size: 14px;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 4px;
    text-transform: uppercase;
  }

  .status-tag.running-process {
    background-color: rgba(220, 53, 69, 0.2);
    color: var(--error-color);
  }

  .status-tag.not-running-process {
    background-color: rgba(40, 167, 69, 0.2);
    color: var(--success-color);
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
</style>
