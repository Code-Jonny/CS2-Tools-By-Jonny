<script setup lang="ts">
  import { onMounted, onUnmounted, watch, computed } from "vue";
  import { invoke } from "@tauri-apps/api/core";
  import { terminateProcess } from "@lib/terminateProcess";
  import { settings, loadAndInitializeSettings, isSettingsLoaded } from "@lib/settingsStore";
  import { powerPlans } from "@lib/powerplans";
  import { runningProcesses } from "@lib/runningProcesses";
  import { applyStartMinimizedSetting } from "@lib/startupUtils";
  import { currentView, updateView } from "@lib/viewStore";
  import { isSidebarExpanded } from "@lib/sidebarStore";

  import Sidebar from "@components/Sidebar.vue";
  import Dashboard from "@components/Dashboard.vue";
  import ProcessManagement from "@components/ProcessManagement.vue";
  import PowerPlanManagement from "@components/PowerPlanManagement.vue";
  import CpuAffinity from "@components/CpuAffinity.vue";
  import NvidiaVibrance from "@components/NvidiaVibrance.vue";
  import SettingsComponent from "@components/Settings.vue";

  let mainLoopIntervalId: ReturnType<typeof setInterval> | undefined = undefined;
  let isMainLoopLogicRunning = false;
  let previousCs2RunningState = false;

  // Main Loop Logic
  async function mainLoop() {
    if (isMainLoopLogicRunning) return;
    isMainLoopLogicRunning = true;

    try {
      await runningProcesses.refresh();
      const cs2Running = runningProcesses.isProcessRunning("cs2.exe");
      const cs2RunningStateChanged = cs2Running !== previousCs2RunningState;
      previousCs2RunningState = cs2Running;

      // Power Plans
      if (cs2RunningStateChanged && settings.powerPlanManagementActive) {
        if (cs2Running && settings.powerPlanCS2.guid) {
          await powerPlans.setActive(settings.powerPlanCS2.guid);
        } else if (!cs2Running && settings.powerPlanDefault.guid) {
          await powerPlans.setActive(settings.powerPlanDefault.guid);
        }
      }

      // CPU Affinity
      if (cs2RunningStateChanged && cs2Running && settings.cpuAffinity?.enabled && settings.cpuAffinity?.selectedCores?.length > 0) {
        const pids = runningProcesses.getPidsForName("cs2.exe");
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

      // Process Killing
      if (cs2Running && settings.processManagementActive && settings.processesToKill?.length > 0) {
        for (const processName of settings.processesToKill) {
          const pids = runningProcesses.getPidsForName(processName);
          for (const pid of pids) {
            await terminateProcess(pid);
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
    stopMainLoop();
    const interval = settings.pollingIntervalMs || 5000;
    mainLoopIntervalId = setInterval(mainLoop, interval);
  }

  function stopMainLoop() {
    if (mainLoopIntervalId !== undefined) {
      clearInterval(mainLoopIntervalId);
      mainLoopIntervalId = undefined;
    }
  }

  // Lifecycle
  onMounted(async () => {
    window.addEventListener("hashchange", updateView);
    updateView();

    console.log("App mounted. Performing initializations.");
    try {
      await loadAndInitializeSettings();
      await invoke("set_minimize_to_tray", { enable: settings.minimizeToTray });
      await applyStartMinimizedSetting();
      await powerPlans.refresh();
      await runningProcesses.refresh();
      startMainLoop();
    } catch (e) {
      console.error("Error during initializations:", e);
    }
  });

  onUnmounted(() => {
    stopMainLoop();
    window.removeEventListener("hashchange", updateView);
  });

  // Watch polling interval
  watch(() => settings.pollingIntervalMs, () => {
    startMainLoop(); // Restart with new interval
  });

  // Watch minimize to tray
  watch(() => settings.minimizeToTray, (enabled) => {
    if (!isSettingsLoaded.value) return;
    invoke("set_minimize_to_tray", { enable: enabled }).catch(console.error);
  });

  // Auto-correct power plan names
  watch([() => powerPlans.plans, () => settings.powerPlanCS2, () => settings.powerPlanDefault], () => {
    if (powerPlans.plans.length > 0) {
      if (settings.powerPlanCS2?.guid) {
        const match = powerPlans.plans.find((p) => p.guid === settings.powerPlanCS2.guid);
        if (match && match.name !== settings.powerPlanCS2.name) {
          console.log(`Auto-correcting CS2 Power Plan name: ${settings.powerPlanCS2.name} -> ${match.name}`);
          settings.powerPlanCS2.name = match.name;
        }
      }
      if (settings.powerPlanDefault?.guid) {
        const match = powerPlans.plans.find((p) => p.guid === settings.powerPlanDefault.guid);
        if (match && match.name !== settings.powerPlanDefault.name) {
          console.log(`Auto-correcting Default Power Plan name: ${settings.powerPlanDefault.name} -> ${match.name}`);
          settings.powerPlanDefault.name = match.name;
        }
      }
    }
  }, { deep: true });

  // View selection
  const components: Record<string, any> = {
    "dashboard": Dashboard,
    "process-management": ProcessManagement,
    "power-plan-management": PowerPlanManagement,
    "cpu-affinity": CpuAffinity,
    "nvidia-vibrance": NvidiaVibrance,
    "settings": SettingsComponent
  };

  const activeComponent = computed(() => {
    return components[currentView.value] || Dashboard;
  });

  const sidebarWidth = computed(() => isSidebarExpanded.value ? '270px' : '60px');
</script>

<template>
  <div>
    <Sidebar />
    <main :style="{ '--current-sidebar-width': sidebarWidth }">
      <component :is="activeComponent" />
    </main>
  </div>
</template>

<style scoped>
  main {
    margin-left: var(--current-sidebar-width);
    padding: 25px;
    background-color: var(--background-primary);
    min-height: 100vh;
    transition: margin-left 0.15s ease-in-out;
  }
</style>
