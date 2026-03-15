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
  import { logInfo, logError, registerLogListener } from "@lib/logger";

  import Sidebar from "@components/Sidebar.vue";
  import Dashboard from "@components/Dashboard.vue";
  import ProcessManagement from "@components/ProcessManagement.vue";
  import PowerPlanManagement from "@components/PowerPlanManagement.vue";
  import CpuAffinity from "@components/CpuAffinity.vue";
  import NvidiaVibrance from "@components/NvidiaVibrance.vue";
  import SettingsComponent from "@components/Settings.vue";
  import { listen } from "@tauri-apps/api/event";

  const affinitySetPids = new Set<number>();

  let cleanupProcessListener: (() => void) | null = null;
  let cleanupWindowListener: (() => void) | null = null;

  async function handleCs2Process(status: "started" | "stopped") {
    try {
      await runningProcesses.refresh();

      if (status === "started") {
        // Power Plans
        if (settings.powerPlanManagementActive && settings.powerPlanCS2.guid) {
          await powerPlans.setActive(settings.powerPlanCS2.guid);
        }

        // CPU Affinity
        if (settings.cpuAffinity?.enabled && settings.cpuAffinity?.selectedCores?.length > 0) {
          const pids = runningProcesses.getPidsForName("cs2.exe");
          const selectedCores = settings.cpuAffinity.selectedCores;

          for (const pid of pids) {
            if (!affinitySetPids.has(pid)) {
              try {
                await invoke("set_process_affinity", { pid, cores: selectedCores });
                logInfo(`[Affinity] Successfully enforced for CS2 (PID ${pid}) with cores [${selectedCores.join(", ")}]`);
                affinitySetPids.add(pid);
              } catch (e) {
                logError(`[Affinity] Failed to set for CS2 (PID ${pid}):`, e);
              }
            }
          }
        }

        // Process Killing
        if (settings.processManagementActive && settings.processesToKill?.length > 0) {
          for (const processName of settings.processesToKill) {
            const pids = runningProcesses.getPidsForName(processName);
            for (const pid of pids) {
              await terminateProcess(pid);
            }
          }
        }
      } else if (status === "stopped") {
        // Power Plans
        if (settings.powerPlanManagementActive && settings.powerPlanDefault.guid) {
          await powerPlans.setActive(settings.powerPlanDefault.guid);
        }

        // reset vibrance setting
        // is needed because cs2window event only triggers when cs2 is running, so if user closes cs2 while it's in background, vibrance won't reset without this. and there could be a race condition where the cs2window detection is too slow.
        if (settings.vibranceSettings?.enabled) {
          await invoke("apply_vibrance_to_focused_display", { level: settings.vibranceSettings.defaultVibrance });
          logInfo(`[Vibrance] CS2 in background. Applied default vibrance ${settings.vibranceSettings.defaultVibrance}`);
        }

        // Cleanup tracking
        affinitySetPids.clear();
      }
    } catch (error) {
      logError("Error in handling CS2 process state:", error);
    }
  }

  async function handleCs2Window(status: "foreground" | "background") {
    try {
      if (settings.vibranceSettings?.enabled) {
        if (status === "foreground") {
          await invoke("apply_vibrance_to_focused_display", { level: settings.vibranceSettings.cs2Vibrance });
          logInfo(`[Vibrance] CS2 in foreground. Applied CS2 vibrance ${settings.vibranceSettings.cs2Vibrance}`);
        } else if (status === "background") {
          await invoke("apply_vibrance_to_focused_display", { level: settings.vibranceSettings.defaultVibrance });
          logInfo(`[Vibrance] CS2 in background. Applied default vibrance ${settings.vibranceSettings.defaultVibrance}`);
        }
      }
    } catch (error) {
      logError("Error in handling CS2 window state:", error);
    }
  }

  // Lifecycle
  onMounted(async () => {
    window.addEventListener("hashchange", updateView);
    updateView();

    logInfo("[Frontend] App mounted. Performing initializations.");
    try {
      registerLogListener();
      await loadAndInitializeSettings();
      await invoke("set_minimize_to_tray", { enable: settings.minimizeToTray });
      await applyStartMinimizedSetting();
      await powerPlans.refresh();
      await runningProcesses.refresh();

      // Listen to Rust events
      cleanupProcessListener = await listen("cs2process", (event) => {
        const status = event.payload as "started" | "stopped";
        logInfo(`[CS2Process] cs2process state changed to: ${status}`);
        handleCs2Process(status);
      });

      cleanupWindowListener = await listen("cs2window", (event) => {
        const status = event.payload as "foreground" | "background";
        logInfo(`[CS2Window] cs2window state changed to: ${status}`);
        handleCs2Window(status);
      });

    } catch (e) {
      logError("Error during initializations:", e);
    }
  });

  onUnmounted(() => {
    if (cleanupProcessListener) cleanupProcessListener();
    if (cleanupWindowListener) cleanupWindowListener();
    window.removeEventListener("hashchange", updateView);
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
          logInfo(`[PowerPlans] Auto-correcting CS2 Power Plan name: ${settings.powerPlanCS2.name} -> ${match.name}`);
          settings.powerPlanCS2.name = match.name;
        }
      }
      if (settings.powerPlanDefault?.guid) {
        const match = powerPlans.plans.find((p) => p.guid === settings.powerPlanDefault.guid);
        if (match && match.name !== settings.powerPlanDefault.name) {
          logInfo(`[PowerPlans] Auto-correcting Default Power Plan name: ${settings.powerPlanDefault.name} -> ${match.name}`);
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
    padding: 25px;
    padding-left: 85px;
    /* padding-left: calc(var(--current-sidebar-width) + 25px); */
    background-color: var(--background-primary);
    min-height: 100vh;
    max-width: 800px;
    margin-inline: auto;
    transition: padding-left 0.15s ease-in-out;
  }
</style>
