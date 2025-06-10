<script lang="ts">
  import { onMount, onDestroy } from "svelte"; // Modified to include onDestroy
  import { os } from "@neutralinojs/lib";
  import { terminateProcess } from "@lib/terminateProcess";
  // Import the reactive settings store
  import { settings } from "@lib/settingsStore.svelte.ts";
  // import { getPowerPlans, setActivePowerPlan } from "@lib/powerplans"; // Removed old import
  import { powerPlans } from "@lib/powerplans.svelte.ts"; // Import the new power plan store
  // import { writable } from "svelte/store"; // Removed: writable replaced by $state

  import {
    runningProcesses,
    type ProcessInfo,
    type FilterType,
    type SortKey,
    type SortOrder,
  } from "@lib/runningProcesses.svelte.ts";

  // Import new components for subpages
  import ProcessManagement from "@components/ProcessManagement.svelte";
  import PowerPlanManagement from "@components/PowerPlanManagement.svelte";
  import Settings from "@components/Settings.svelte";
  import Dashboard from "@components/Dashboard.svelte"; // Import the Dashboard component

  // New variables and functions for the main loop
  let mainLoopIntervalId: NodeJS.Timeout | undefined = undefined; // Modified type
  let isMainLoopLogicRunning: boolean = false;
  let currentPollingInterval = settings.pollingIntervalMs; // To track changes
  let previousCs2RunningState: boolean = false; // Added to store previous CS2 running state
  let cs2RunningStateChanged: boolean = false; // Added to track if CS2 running state changed

  // Client-side routing
  let currentView = $state("dashboard"); // Default view. Changed from writable to $state

  function updateView() {
    const hash = window.location.hash.substring(1); // Remove #
    if (hash === "/process-management") {
      currentView = "process-management";
    } else if (hash === "/power-plan-management") {
      currentView = "power-plan-management";
    } else if (hash === "/settings") {
      currentView = "settings";
    } else {
      // Default to dashboard for '/' or other/empty hashes
      currentView = "dashboard";
    }
  }

  async function mainLoop() {
    if (isMainLoopLogicRunning) {
      // console.log("Main loop logic is already running. Skipping this tick.");
      return;
    }

    isMainLoopLogicRunning = true;
    try {
      const date = new Date();
      const time = date.toLocaleTimeString();
      console.log("Main loop tick:", time);

      // Refresh running processes
      await runningProcesses.refresh();

      // Refresh power plans
      await powerPlans.refresh();

      const cs2Running = runningProcesses.isProcessRunning("cs2.exe");
      // console.log(time, cs2Running ? "CS2 is running." : "CS2 is not running.");

      // Update cs2RunningStateChanged
      cs2RunningStateChanged = cs2Running !== previousCs2RunningState;
      previousCs2RunningState = cs2Running; // Update previous state for next tick

      if (cs2RunningStateChanged) {
        console.log(`CS2 running state changed to: ${cs2Running}`);
      }

      if (cs2Running) {
        // only run if the setting is enabled and there are processes in the kill list
        if (
          settings.processManagementActive &&
          settings.processesToKill &&
          settings.processesToKill.length > 0
        ) {
          for (const processName of settings.processesToKill) {
            // Check if the process is running before attempting to terminate
            if (runningProcesses.isProcessRunning(processName)) {
              // Call the terminateProcess function
              await terminateProcess(processName);
            }
          }
        }
      }
      // console.log(time, "Polling for active processes complete.");
      // --- End of integrated logic ---
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
    const interval = settings.pollingIntervalMs || 5000; // Default to 5 seconds if not set
    mainLoopIntervalId = setInterval(mainLoop, interval);
    // console.log(`Main loop started with interval: ${interval}ms`);
  }

  function stopMainLoop() {
    if (mainLoopIntervalId !== undefined) {
      clearInterval(mainLoopIntervalId);
      mainLoopIntervalId = undefined;
      // console.log("Main loop stopped.");
    }
    isMainLoopLogicRunning = false; // Reset flag
  }

  onMount(async () => {
    // Start the main loop
    startMainLoop();
    currentPollingInterval = settings.pollingIntervalMs; // Initialize currentPollingInterval

    // Initial fetch of power plans and processes
    await powerPlans.refresh();
    await runningProcesses.refresh();

    // Setup client-side routing
    window.addEventListener("hashchange", updateView);
    updateView(); // Set initial view based on current hash
  });

  // Reactive statement to restart the loop if pollingInterval changes
  $effect(() => {
    if (
      settings.pollingIntervalMs !== undefined &&
      settings.pollingIntervalMs !== currentPollingInterval
    ) {
      // console.log(`Polling interval changed from ${currentPollingInterval} to ${settings.pollingIntervalMs}. Restarting main loop.`);
      currentPollingInterval = settings.pollingIntervalMs;
      startMainLoop();
    }
  });

  onDestroy(() => {
    stopMainLoop(); // Clean up the interval when the component is destroyed
    window.removeEventListener("hashchange", updateView); // Clean up event listener
  });
</script>

<nav>
  <ul>
    <li><a href="#/">Dashboard</a></li>
    <li><a href="#/process-management">Process Management</a></li>
    <li><a href="#/power-plan-management">Power Plan Management</a></li>
    <li><a href="#/settings">Settings</a></li>
  </ul>
</nav>

<main>
  {#if currentView === "dashboard"}
    <Dashboard /> <!-- Use the Dashboard component -->
  {:else if currentView === "process-management"}
    <ProcessManagement />
  {:else if currentView === "power-plan-management"}
    <PowerPlanManagement />
  {:else if currentView === "settings"}
    <Settings />
  {/if}
</main>

<style scoped>
  nav {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 200px; /* Adjust width as needed */
    background-color: #f0f0f0; /* Example background color */
    padding: 20px;

    ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    li a {
      text-decoration: none;
      color: #333; /* Example link color */
      display: block;
      padding: 10px;
      margin-bottom: 5px;

      &:hover {
        background-color: #ddd; /* Example hover effect */
      }
    }
  }

  main {
    margin-left: 220px; /* Adjust to be slightly more than nav width to account for padding or borders */
    padding: 20px;
  }
</style>
