<script lang="ts">
  import { onMount, onDestroy } from "svelte"; // Modified to include onDestroy
  import { terminateProcess } from "@lib/terminateProcess";
  // Import the reactive settings store
  import { settings } from "@lib/settingsStore.svelte.ts";
  // import { getPowerPlans, setActivePowerPlan } from "@lib/powerplans"; // Removed old import
  import { powerPlans } from "@lib/powerplans.svelte.ts"; // Import the new power plan store
  import Icon from "@iconify/svelte";

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

      const cs2Running = runningProcesses.isProcessRunning("cs2.exe");
      // console.log(time, cs2Running ? "CS2 is running." : "CS2 is not running.");

      // Update cs2RunningStateChanged
      cs2RunningStateChanged = cs2Running !== previousCs2RunningState;
      previousCs2RunningState = cs2Running; // Update previous state for next tick

      if (cs2RunningStateChanged && settings.powerPlanManagementActive) {
        // console.log(time, "CS2 running state changed. Updating power plan.");
        // If CS2 running state changed and power plan management is active, set the active power plan
        if (cs2Running && settings.powerPlanCS2) {
          await powerPlans.setActive(settings.powerPlanCS2);
        } else if (!cs2Running && settings.powerPlanDefault) {
          await powerPlans.setActive(settings.powerPlanDefault);
        }
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

    // Initial fetch of processes
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
    <li class="sidebar-title">CS2Tools by Jonny</li>
    <li>
      <a href="#/" class:active={currentView === "dashboard"}
        ><Icon icon="solar:home-smile-linear" width="16" height="16" /> Dashboard</a
      >
    </li>
    <li>
      <a
        href="#/process-management"
        class:active={currentView === "process-management"}
        ><Icon icon="solar:cpu-linear" width="16" height="16" /> Process Management</a
      >
    </li>
    <li>
      <a
        href="#/power-plan-management"
        class:active={currentView === "power-plan-management"}
        ><Icon icon="solar:power-linear" width="16" height="16" /> Power Plan Management</a
      >
    </li>
    <li>
      <a href="#/settings" class:active={currentView === "settings"}
        ><Icon icon="solar:settings-linear" width="16" height="16" /> Settings</a
      >
    </li>
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
    width: 250px; /* Adjusted width */
    background-color: var(--background-secondary);
    padding-top: 20px; /* Add some padding at the top */
    border-right: 1px solid var(--background-primary); /* Subtle border */

    ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .sidebar-title {
      font-size: 20px; /* Slightly smaller than H2, but prominent */
      font-weight: 600; /* Inter Semi-Bold */
      text-align: center;
      padding: 20px 15px 30px 15px; /* Adjusted padding */
      color: var(--primary-accent); /* Use accent for the title */
      border-bottom: 1px solid var(--background-primary);
      margin-bottom: 10px;
    }

    li a {
      text-decoration: none;
      color: var(--text-primary);
      display: flex; /* Keep flex for icon alignment */
      align-items: center;
      gap: 12px; /* Increased gap */
      padding: 15px 20px; /* Adjusted padding */
      font-size: 13px; /* Body Text for nav items */
      font-weight: 400; /* Inter Regular */
      transition:
        background-color 0.2s ease-in-out,
        color 0.2s ease-in-out;

      &:hover {
        background-color: var(--background-primary);
        color: var(--primary-accent);
      }

      &.active {
        background-color: var(--primary-accent);
        color: var(--background-primary); /* Dark text on accent background */
        font-weight: 600; /* Inter Semi-Bold for active link */
      }

      /* Style for the icon within the link */
      :global(svg) {
        color: currentColor; /* Icon inherits color from parent <a> */
        transition: color 0.2s ease-in-out;
      }
    }
  }

  main {
    margin-left: 250px; /* Match nav width */
    padding: 25px; /* Consistent padding */
    background-color: var(--background-primary);
    min-height: 100vh; /* Ensure main content area takes full height */
  }
</style>
