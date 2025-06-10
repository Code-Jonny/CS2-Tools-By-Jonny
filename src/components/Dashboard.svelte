<script lang="ts">
  import { runningProcesses } from "@lib/runningProcesses.svelte.ts";
  import { settings } from "@lib/settingsStore.svelte.ts"; // Import settings store
  import type { ProcessInfo } from "@lib/runningProcesses.svelte.ts"; // Import ProcessInfo for typing
  import { powerPlans } from "@lib/powerplans.svelte.ts"; // Import the power plan store

  // Use $runningProcesses to get the reactive value of the store (ProcessStoreState).
  // Then access .processes on that value.
  let isCS2Running = $derived(
    $runningProcesses.processes.some(
      (p: ProcessInfo) => p.name.toLowerCase() === "cs2.exe"
    )
  );

  // Derive killListProcessStatuses similarly, using $runningProcesses.processes.
  let killListProcessStatuses = $derived(
    settings.processesToKill.map((processName) => ({
      name: processName,
      isRunning: $runningProcesses.processes.some(
        (p: ProcessInfo) => p.name.toLowerCase() === processName.toLowerCase()
      ),
    }))
  );

  // Get the active power plan reactively
  let activePowerPlan = $derived(powerPlans.activePlan);
</script>

<div class="container">
  <h3>Dashboard</h3>
  {#if isCS2Running}
    <p style="color: green; font-weight: bold;">
      Counter-Strike 2 (cs2.exe) is currently running.
    </p>
  {:else}
    <p style="color: red; font-weight: bold;">
      Counter-Strike 2 (cs2.exe) is not running.
    </p>
  {/if}

  {#if settings.processManagementActive && killListProcessStatuses.length > 0}
    <h4>Kill List Process Status:</h4>
    <ul>
      {#each killListProcessStatuses as process}
        <li>
          {process.name}:
          {#if process.isRunning}
            <span style="color: orange; font-weight: bold;">Running</span>
          {:else}
            <span style="color: grey;">Not Running</span>
          {/if}
        </li>
      {/each}
    </ul>
  {:else if settings.processManagementActive}
    <p>No processes configured in the kill list.</p>
  {/if}

  <h4>Active Power Plan:</h4>
  {#if powerPlans.isLoading}
    <p>Loading power plan...</p>
  {:else if powerPlans.error}
    <p style="color: red;">Error loading power plan: {powerPlans.error}</p>
  {:else if activePowerPlan}
    <p style="color: blue; font-weight: bold;">{activePowerPlan.name}</p>
  {:else}
    <p>No active power plan found or power plans not loaded yet.</p>
  {/if}

  <p>This is the main dashboard. More features can be added here.</p>
</div>

<style scoped>
  .container {
    /* Styles for the dashboard container */
    padding: 1em;
  }
  h3 {
    margin-bottom: 0.5em;
    font-size: 1.5em;
  }
  h4 {
    margin-top: 1em;
    margin-bottom: 0.3em;
    font-size: 1.2em;
  }
  p {
    font-size: 1.1em;
    line-height: 1.6;
  }
  ul {
    list-style-type: none;
    padding-left: 0;
  }
  li {
    margin-bottom: 0.3em;
  }
</style>
