<script setup lang="ts">
  import { computed } from 'vue';
  import { runningProcesses, type ProcessInfo } from "@lib/runningProcesses";
  import { settings } from "@lib/settingsStore";
  import { powerPlans } from "@lib/powerplans";
  import { Icon } from "@iconify/vue";
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
</script>

<template>
  <div class="dashboard-container">
    <h1>Dashboard</h1>

    <Card title="Counter-Strike 2 Status" icon="simple-icons:counterstrike">
      <div v-if="isCS2Running" class="status-indicator running">
        <Icon icon="solar:play-circle-bold" width="32" height="32" />
        <span>CS2 is <strong>RUNNING</strong></span>
      </div>
      <div v-else class="status-indicator not-running">
        <Icon icon="solar:stop-circle-bold" width="32" height="32" />
        <span>CS2 is <strong>NOT RUNNING</strong></span>
      </div>
    </Card>

    <Card title="Active Power Plan" icon="solar:bolt-linear">
      <p v-if="powerPlans.error" class="error-text">
        <Icon icon="solar:danger-triangle-linear" width="20" height="20" />
        Error
        loading power plan: {{ powerPlans.error }}
      </p>
      <p v-else-if="activePowerPlan" class="status-indicator">
        {{ activePowerPlan.name }}</p>
      <p v-else class="info-text">No active power plan found or not loaded yet.
      </p>
    </Card>

    <Card v-if="settings.processManagementActive"
          title="Kill List Process Status"
          icon="solar:checklist-minimalistic-linear">
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
  </div>
</template>

<style scoped>
  .dashboard-container {
    display: flex;
    flex-direction: column;
    gap: 25px;
    /* Spacing between cards */
  }

  h1 {
    /* Styles inherited from app.css or can be overridden here */
    margin-bottom: 25px;
    /* More space after main title */
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
    color: var(--text-secondary);
    /* Greyed out when not running */
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

  /* Process Status List */
  .process-status-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .process-status-list li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background-color: var(--background-primary);
    border-radius: 4px;
    /* Slightly rounded for list items */
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
    /* Red background alpha */
    color: var(--error-color);
  }

  /* "Not Running" for kill list processes means GOOD/SUCCESS usually? 
     Or just neutral? 
     If the goal is to kill them, then "Not Running" is good.
     But here it just shows status.
     Let's stick to Green for Not Running if they are "Processes To Kill" :) 
     Wait, if I want to play CS2, I want them dead. So Not Running = Good.
  */
  .status-tag.not-running-process {
    background-color: rgba(40, 167, 69, 0.2);
    /* Green background alpha */
    color: var(--success-color);
  }
</style>
