<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { terminateProcess } from "@lib/terminateProcess";
  import {
    settings,
    loadAndInitializeSettings,
  } from "@lib/settingsStore.svelte.ts";
  import { powerPlans } from "@lib/powerplans.svelte.ts";
  import Icon from "@iconify/svelte";
  import { applyStartMinimizedSetting } from "@lib/startupUtils.ts";

  import {
    runningProcesses,
    type ProcessInfo,
    type FilterType,
    type SortKey,
    type SortOrder,
  } from "@lib/runningProcesses.svelte.ts";

  import ProcessManagement from "@components/ProcessManagement.svelte";
  import PowerPlanManagement from "@components/PowerPlanManagement.svelte";
  import NvidiaVibrance from "@components/NvidiaVibrance.svelte";
  import SettingsComponent from "@components/Settings.svelte"; // Renamed to avoid conflict with settings store
  import Dashboard from "@components/Dashboard.svelte";
  import Sidebar from "@components/Sidebar.svelte";
  import { currentView, updateView } from "@lib/viewStore.svelte.ts";
  import { isSidebarExpanded } from "@lib/sidebarStore.svelte.ts"; // Import the sidebar state

  // --- State Variables ---
  let mainLoopIntervalId: NodeJS.Timeout | undefined = undefined;
  let isMainLoopLogicRunning: boolean = false;
  let currentPollingInterval = settings.pollingIntervalMs; // Can be initialized from store
  let previousCs2RunningState: boolean = false;
  let cs2RunningStateChanged: boolean = false;

  /**
   * The main application loop.
   * This function runs periodically to check for running processes and manage power plans.
   * It is the core logic for the automation features of the app.
   */
  async function mainLoop() {
    // Prevent overlapping executions if the loop takes longer than the interval
    if (isMainLoopLogicRunning) {
      return;
    }
    isMainLoopLogicRunning = true;
    try {
      const date = new Date();
      const time = date.toLocaleTimeString();
      // console.log("Main loop tick:", time); // Keep console logs for debugging if needed

      // Refresh the list of running processes
      await runningProcesses.refresh();
      const cs2Running = runningProcesses.isProcessRunning("cs2.exe");

      // Detect if the running state of CS2 has changed
      cs2RunningStateChanged = cs2Running !== previousCs2RunningState;
      previousCs2RunningState = cs2Running;

      // Handle Power Plan Switching
      if (cs2RunningStateChanged && settings.powerPlanManagementActive) {
        if (cs2Running && settings.powerPlanCS2.guid) {
          // Switch to high performance plan when CS2 starts
          await powerPlans.setActive(settings.powerPlanCS2.guid);
        } else if (!cs2Running && settings.powerPlanDefault.guid) {
          // Revert to default plan when CS2 stops
          await powerPlans.setActive(settings.powerPlanDefault.guid);
        }
      }

      // Handle Process Management (Killing unwanted processes)
      if (cs2Running) {
        if (
          settings.processManagementActive &&
          settings.processesToKill &&
          settings.processesToKill.length > 0
        ) {
          for (const processName of settings.processesToKill) {
            // In Tauri version, we might need to find PIDs first if terminateProcess takes PID
            // But terminateProcess in App.svelte was taking name.
            // Let's check terminateProcess signature.
            // It was updated to take PID.
            // So we need to find PIDs for the process name.
            const pids = runningProcesses.getPidsForName(processName);
            for (const pid of pids) {
              await terminateProcess(pid);
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

  /**
   * Starts the main application loop with the configured polling interval.
   * Clears any existing loop before starting a new one.
   */
  function startMainLoop() {
    if (mainLoopIntervalId !== undefined) {
      clearInterval(mainLoopIntervalId);
    }
    const interval = settings.pollingIntervalMs || 5000;
    mainLoopIntervalId = setInterval(mainLoop, interval);
  }

  /**
   * Stops the main application loop.
   */
  function stopMainLoop() {
    if (mainLoopIntervalId !== undefined) {
      clearInterval(mainLoopIntervalId);
      mainLoopIntervalId = undefined;
    }
    isMainLoopLogicRunning = false;
  }

  onMount(async () => {
    // Initialize non-Neutralino specific things or things that can run before NL is ready
    currentPollingInterval = settings.pollingIntervalMs;
    window.addEventListener("hashchange", updateView);
    updateView(); // Initial view setup

    console.log("App mounted. Performing initializations.");
    try {
      await loadAndInitializeSettings();
      await applyStartMinimizedSetting();
      await powerPlans.refresh();
      await runningProcesses.refresh();
      startMainLoop();
    } catch (error) {
      console.error("Error during initializations:", error);
    }
  });

  // Reactively restart the main loop if the polling interval setting changes
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
  {:else if $currentView === "nvidia-vibrance"}
    <NvidiaVibrance />
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
