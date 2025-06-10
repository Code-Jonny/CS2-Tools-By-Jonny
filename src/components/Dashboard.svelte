<script lang="ts">
  import { runningProcesses } from "@lib/runningProcesses.svelte.ts";
  import { settings } from "@lib/settingsStore.svelte.ts"; // Import settings store
  import type { ProcessInfo } from "@lib/runningProcesses.svelte.ts"; // Import ProcessInfo for typing
  import { powerPlans } from "@lib/powerplans.svelte.ts"; // Import the power plan store
  import Icon from "@iconify/svelte"; // Import Icon component for icons

  // Use $runningProcesses to get the reactive value of the store (ProcessStoreState).
  // Then access .processes on that value.
  let isCS2Running = $derived(
    $runningProcesses?.processes?.some(
      (p: ProcessInfo) => p?.name?.toLowerCase() === "cs2.exe"
    ) ?? false
  );

  // Derive killListProcessStatuses similarly, using $runningProcesses.processes.
  let killListProcessStatuses = $derived(
    settings.processesToKill.map((processName) => ({
      name: processName,
      isRunning:
        $runningProcesses?.processes?.some(
          (p: ProcessInfo) =>
            p?.name?.toLowerCase() === processName?.toLowerCase()
        ) ?? false,
    }))
  );

  // Get the active power plan reactively
  let activePowerPlan = $derived(powerPlans?.activePlan ?? null);
</script>

<div class="dashboard-container">
  <h1>Dashboard</h1>

  <div class="status-card cs2-status-card">
    <div class="card-header">
      <Icon icon="simple-icons:counterstrike" width="28" height="28" />
      <h3>Counter-Strike 2 Status</h3>
    </div>
    <div class="card-content">
      {#if isCS2Running}
        <div class="status-indicator running">
          <Icon icon="solar:play-circle-bold" width="32" height="32" />
          <span>CS2 is <strong>RUNNING</strong></span>
        </div>
      {:else}
        <div class="status-indicator not-running">
          <Icon icon="solar:stop-circle-bold" width="32" height="32" />
          <span>CS2 is <strong>NOT RUNNING</strong></span>
        </div>
      {/if}
    </div>
  </div>

  <div class="status-card power-plan-card">
    <div class="card-header">
      <Icon icon="solar:bolt-linear" width="28" height="28" />
      <h3>Active Power Plan</h3>
    </div>
    <div class="card-content">
      {#if powerPlans.error}
        <p class="error-text">
          <Icon icon="solar:danger-triangle-linear" width="20" height="20" /> Error
          loading power plan: {powerPlans.error}
        </p>
      {:else if activePowerPlan}
        <p class="power-plan-name">{activePowerPlan.name}</p>
      {:else}
        <p class="info-text">No active power plan found or not loaded yet.</p>
      {/if}
    </div>
  </div>

  {#if settings.processManagementActive}
    <div class="status-card process-list-card">
      <div class="card-header">
        <Icon
          icon="solar:checklist-minimalistic-linear"
          width="28"
          height="28"
        />
        <h3>Kill List Process Status</h3>
      </div>
      <div class="card-content">
        {#if killListProcessStatuses.length > 0}
          <ul class="process-status-list">
            {#each killListProcessStatuses as process}
              <li>
                <span>{process.name}:</span>
                {#if process.isRunning}
                  <span class="status-tag running-process">Running</span>
                {:else}
                  <span class="status-tag not-running-process">Not Running</span
                  >
                {/if}
              </li>
            {/each}
          </ul>
        {:else}
          <p class="info-text">No processes configured in the kill list.</p>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .dashboard-container {
    display: flex;
    flex-direction: column;
    gap: 25px; /* Spacing between cards */
  }

  h1 {
    /* Styles inherited from app.css or can be overridden here */
    margin-bottom: 25px; /* More space after main title */
  }

  .status-card {
    background-color: var(--background-secondary);
    border-radius: var(--window-corner-radius);
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); /* Subtle shadow */
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--background-primary);
  }

  .card-header h3 {
    margin-bottom: 0; /* Reset margin as it's handled by card-header */
    color: var(--primary-accent);
  }

  .card-header :global(svg) {
    color: var(--primary-accent);
  }

  .card-content p,
  .card-content ul {
    margin-top: 0;
  }

  .status-indicator {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 18px; /* Larger status text */
  }

  .status-indicator :global(svg) {
    margin-right: 8px;
  }

  .status-indicator.running {
    color: var(--success-color);
  }
  .status-indicator.running :global(svg) {
    color: var(--success-color);
  }

  .status-indicator.not-running {
    color: var(--text-secondary);
  }
  .status-indicator.not-running :global(svg) {
    color: var(--text-secondary);
  }

  .power-plan-name {
    font-size: 18px;
    font-weight: 500; /* Inter Medium */
    color: var(--primary-accent);
  }

  .process-status-list {
    list-style: none;
    padding: 0;
  }

  .process-status-list li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid var(--background-primary);
  }
  .process-status-list li:last-child {
    border-bottom: none;
  }

  .status-tag {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500; /* Inter Medium */
  }

  .status-tag.running-process {
    background-color: var(--warning-color);
    color: var(--background-primary);
  }

  .status-tag.not-running-process {
    background-color: var(--text-secondary);
    color: var(--background-primary);
  }

  .error-text {
    color: var(--error-color);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .error-text :global(svg) {
    color: var(--error-color);
  }

  .info-text {
    color: var(--text-secondary);
    font-style: italic;
  }
</style>
