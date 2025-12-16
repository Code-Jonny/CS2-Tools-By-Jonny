<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { invoke } from "@tauri-apps/api/core";
  import { setItem } from "@lib/storage";
  import { terminateProcess } from "@lib/terminateProcess";
  import {
    settings,
    loadAndInitializeSettings,
    isSettingsLoaded,
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
  import CpuAffinity from "@components/CpuAffinity.svelte";
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

      // Handle CPU Affinity
      if (
        cs2RunningStateChanged &&
        cs2Running &&
        settings.cpuAffinity?.enabled &&
        settings.cpuAffinity?.selectedCores?.length > 0
      ) {
        // We need to get PIDs. runningProcesses has getPidsForName.
        // But wait, runningProcesses.getPidsForName might not be exposed on the store object directly if I didn't see it.
        // Let's check runningProcesses.svelte.ts again to be absolutely sure.
        // If it's not there, I can filter the list.
        // But App.svelte used it later: const pids = runningProcesses.getPidsForName(processName);
        // So it must be there.
        const pids = runningProcesses.getPidsForName("cs2.exe");

        // Calculate mask
        let mask = 0n;
        for (const core of settings.cpuAffinity.selectedCores) {
          mask |= 1n << BigInt(core);
        }
        const maskStr = mask.toString();

        for (const pid of pids) {
          try {
            await invoke("set_process_affinity", { pid, mask: maskStr });
            console.log(`Set affinity for CS2 (PID ${pid}) to ${maskStr}`);
          } catch (e) {
            console.error(`Failed to set affinity for CS2 (PID ${pid}):`, e);
          }
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

  $effect(() => {
    // Persist and Sync Vibrance Settings
    // This ensures that changes to the nested vibranceSettings object are saved and synced,
    // as the top-level proxy in settingsStore only catches top-level assignments.

    // Only run if settings are fully loaded to avoid overwriting with defaults
    if (!isSettingsLoaded.value) return;

    const vSettings = settings.vibranceSettings;

    // Save to disk
    setItem("vibranceSettings", vSettings).catch((e) =>
      console.error("Failed to save vibrance settings", e)
    );

    // Sync to Rust backend
    invoke("set_vibrance_settings", {
      enabled: vSettings.enabled,
      defaultVibrance: vSettings.defaultVibrance,
      cs2Vibrance: vSettings.cs2Vibrance,
    }).catch((e) => console.error("Failed to sync vibrance settings:", e));
  });

  $effect(() => {
    // Persist CPU Affinity Settings
    if (!isSettingsLoaded.value) return;

    const cpuSettings = settings.cpuAffinity;
    setItem("cpuAffinity", cpuSettings).catch((e) =>
      console.error("Failed to save cpu affinity settings", e)
    );
  });

  $effect(() => {
    // Auto-correct power plan names if they differ from the fetched plans (e.g. encoding fix)
    // This runs whenever powerPlans.plans or settings change.
    if (powerPlans.plans.length > 0) {
      if (settings.powerPlanCS2?.guid) {
        const match = powerPlans.plans.find(
          (p) => p.guid === settings.powerPlanCS2.guid
        );
        if (match && match.name !== settings.powerPlanCS2.name) {
          console.log(
            `Auto-correcting CS2 Power Plan name: ${settings.powerPlanCS2.name} -> ${match.name}`
          );
          settings.powerPlanCS2.name = match.name;
        }
      }
      if (settings.powerPlanDefault?.guid) {
        const match = powerPlans.plans.find(
          (p) => p.guid === settings.powerPlanDefault.guid
        );
        if (match && match.name !== settings.powerPlanDefault.name) {
          console.log(
            `Auto-correcting Default Power Plan name: ${settings.powerPlanDefault.name} -> ${match.name}`
          );
          settings.powerPlanDefault.name = match.name;
        }
      }
    }
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
  {:else if $currentView === "cpu-affinity"}
    <CpuAffinity />
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
