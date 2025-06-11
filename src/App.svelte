<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { terminateProcess } from "@lib/terminateProcess";
  import { settings } from "@lib/settingsStore.svelte.ts";
  import { powerPlans } from "@lib/powerplans.svelte.ts";
  import Icon from "@iconify/svelte";

  import {
    runningProcesses,
    type ProcessInfo,
    type FilterType,
    type SortKey,
    type SortOrder,
  } from "@lib/runningProcesses.svelte.ts";

  import ProcessManagement from "@components/ProcessManagement.svelte";
  import PowerPlanManagement from "@components/PowerPlanManagement.svelte";
  import SettingsComponent from "@components/Settings.svelte"; // Renamed to avoid conflict with settings store
  import Dashboard from "@components/Dashboard.svelte";
  import Sidebar from "@components/Sidebar.svelte";
  import { currentView, updateView } from "@lib/viewStore.svelte.ts";
  import { isSidebarExpanded } from "@lib/sidebarStore.svelte.ts"; // Import the sidebar state

  let mainLoopIntervalId: NodeJS.Timeout | undefined = undefined;
  let isMainLoopLogicRunning: boolean = false;
  let currentPollingInterval = settings.pollingIntervalMs;
  let previousCs2RunningState: boolean = false;
  let cs2RunningStateChanged: boolean = false;

  async function mainLoop() {
    if (isMainLoopLogicRunning) {
      return;
    }
    isMainLoopLogicRunning = true;
    try {
      const date = new Date();
      const time = date.toLocaleTimeString();
      // console.log("Main loop tick:", time); // Keep console logs for debugging if needed

      await runningProcesses.refresh();
      const cs2Running = runningProcesses.isProcessRunning("cs2.exe");

      cs2RunningStateChanged = cs2Running !== previousCs2RunningState;
      previousCs2RunningState = cs2Running;

      if (cs2RunningStateChanged && settings.powerPlanManagementActive) {
        if (cs2Running && settings.powerPlanCS2) {
          await powerPlans.setActive(settings.powerPlanCS2);
        } else if (!cs2Running && settings.powerPlanDefault) {
          await powerPlans.setActive(settings.powerPlanDefault);
        }
      }

      if (cs2Running) {
        if (
          settings.processManagementActive &&
          settings.processesToKill &&
          settings.processesToKill.length > 0
        ) {
          for (const processName of settings.processesToKill) {
            if (runningProcesses.isProcessRunning(processName)) {
              await terminateProcess(processName);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error in main loop:", error);
    } finally {
      isMainLoopLogicRunning = false;
    }
  }

  function startMainLoop() {
    if (mainLoopIntervalId !== undefined) {
      clearInterval(mainLoopIntervalId);
    }
    const interval = settings.pollingIntervalMs || 5000;
    mainLoopIntervalId = setInterval(mainLoop, interval);
  }

  function stopMainLoop() {
    if (mainLoopIntervalId !== undefined) {
      clearInterval(mainLoopIntervalId);
      mainLoopIntervalId = undefined;
    }
    isMainLoopLogicRunning = false;
  }

  onMount(async () => {
    startMainLoop();
    currentPollingInterval = settings.pollingIntervalMs;
    await powerPlans.refresh();
    await runningProcesses.refresh();
    window.addEventListener("hashchange", updateView);
    updateView();
  });

  $effect(() => {
    if (
      settings.pollingIntervalMs !== undefined &&
      settings.pollingIntervalMs !== currentPollingInterval
    ) {
      currentPollingInterval = settings.pollingIntervalMs;
      startMainLoop();
    }
  });

  onDestroy(() => {
    stopMainLoop();
    window.removeEventListener("hashchange", updateView);
  });

  // Derive sidebar width for main content margin
  let sidebarWidth = $derived($isSidebarExpanded ? "270px" : "60px");
</script>

<Sidebar />

<main style="--current-sidebar-width: {sidebarWidth};">
  {#if $currentView === "dashboard"}
    <Dashboard />
  {:else if $currentView === "process-management"}
    <ProcessManagement />
  {:else if $currentView === "power-plan-management"}
    <PowerPlanManagement />
  {:else if $currentView === "settings"}
    <SettingsComponent />
  {/if}
</main>

<style scoped>
  main {
    margin-left: var(--current-sidebar-width);
    padding: 25px;
    background-color: var(--background-primary);
    min-height: 100vh;
    transition: margin-left 0.15s ease-in-out; /* Smooth transition for margin change */
  }
</style>
