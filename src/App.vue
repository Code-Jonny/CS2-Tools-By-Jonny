<script setup lang="ts">
  import { onMounted, onUnmounted, watch, computed } from "vue";
  import { invoke } from "@tauri-apps/api/core";
  import { settings, loadAndInitializeSettings, isSettingsLoaded } from "@lib/settingsStore";
  import { powerPlans } from "@lib/powerplans";
  import { runningProcesses } from "@lib/runningProcesses";
  import { applyStartMinimizedSetting } from "@lib/startupUtils";
  import { currentView, updateView } from "@lib/viewStore";
  import { isSidebarExpanded } from "@lib/sidebarStore";
  import { logInfo, logError, registerLogListener } from "@lib/logger";

  import { initWindowManager } from "@lib/windowManager";
  import { initCs2EventTracking } from "@lib/eventOrchestrator";

  import Sidebar from "@components/Sidebar.vue";
  import Dashboard from "@components/Dashboard.vue";
  import ProcessManagement from "@components/ProcessManagement.vue";
  import PowerPlanManagement from "@components/PowerPlanManagement.vue";
  import CpuCoreManagement from "@components/CpuCoreManagement.vue";
  import NvidiaVibrance from "@components/NvidiaVibrance.vue";
  import SettingsComponent from "@components/Settings.vue";
  import About from "@components/About.vue";

  let cleanupListeners: (() => void) | null = null;

  // Lifecycle
  onMounted(async () => {
    window.addEventListener("hashchange", updateView);
    updateView();

    logInfo("[Frontend] App mounted. Performing initializations.");
    try {
      registerLogListener();
      await loadAndInitializeSettings();

      initWindowManager();

      await invoke("set_minimize_to_tray", { enable: settings.minimizeToTray });
      await applyStartMinimizedSetting();
      await powerPlans.refresh();
      await runningProcesses.refresh();

      cleanupListeners = await initCs2EventTracking();

    } catch (e) {
      logError("Error during initializations:", e);
    }
  });

  onUnmounted(() => {
    if (cleanupListeners) cleanupListeners();
    window.removeEventListener("hashchange", updateView);
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
    "cpu-core-management": CpuCoreManagement,
    "nvidia-vibrance": NvidiaVibrance,
    "settings": SettingsComponent,
    "about": About
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
