<script lang="ts">
  import { onMount, onDestroy } from "svelte"; // Modified to include onDestroy
  import { os } from "@neutralinojs/lib";
  import { terminateProcess } from "@lib/terminateProcess";
  // Import the reactive settings store
  import { settings } from "@lib/settingsStore.svelte.ts";
  import { getPowerPlans, setActivePowerPlan } from "@lib/powerplan";
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
  // Settings component might still be used if it contains other settings, or can be removed if all are moved.
  // For now, let's assume it might still have general settings or the reset button.
  // If not, this import can be removed later.
  import Settings from "@components/Settings.svelte";

  // New variables and functions for the main loop
  let mainLoopIntervalId: NodeJS.Timeout | undefined = undefined; // Modified type
  let isMainLoopLogicRunning: boolean = false;
  let currentPollingInterval = settings.pollingIntervalMs; // To track changes

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

      // --- Integrated logic from previous setInterval ---
      // const command = 'tasklist | findstr /i "cs2.exe"'; // This might be platform specific
      // const output = await os.execCommand(command); // Consider error handling for execCommand

      // It's generally better to use the runningProcesses store if it's already polling/updating
      // For example, if runningProcesses.refresh() is efficient and updates the store:
      await runningProcesses.refresh(); // Assuming this updates the list of processes

      const cs2Running = runningProcesses.isProcessRunning("cs2.exe");
      // console.log(time, cs2Running ? "CS2 is running." : "CS2 is not running.");

      if (cs2Running) {
        if (settings.processesToKill && settings.processesToKill.length > 0) {
          for (const processName of settings.processesToKill) {
            // console.log(time, `CS2 is running. Attempting to kill ${processName}`);
            await terminateProcess(processName);
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
    let powerPlans = await getPowerPlans();
    console.log("Available Power Plans:", powerPlans);

    // Start the main loop
    startMainLoop();
    currentPollingInterval = settings.pollingIntervalMs; // Initialize currentPollingInterval

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
    <!-- Link to general settings if Settings.svelte still has relevant content -->
    <!-- <li><a href="#/settings">Settings</a></li> -->
  </ul>
</nav>

<main>
  {#if currentView === "dashboard"}
    <div class="container">
      <!-- Dashboard content will go here, currently empty as requested -->
      <h3>Dashboard</h3>
      <p>
        Welcome to the Dashboard. This area is currently under construction.
      </p>
    </div>
  {:else if currentView === "process-management"}
    <ProcessManagement />
  {:else if currentView === "power-plan-management"}
    <PowerPlanManagement />
  {:else if currentView === "settings"}
    <!-- Render Settings.svelte if it's still used for general settings -->
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
