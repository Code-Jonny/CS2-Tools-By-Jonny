import { invoke } from "@tauri-apps/api/core";
import { runningProcesses } from "@lib/runningProcesses";
import { logInfo, logError } from "@lib/logger";
import { settings } from "@lib/settingsStore";

const affinitySetPids = new Set<number>();

export const cpuManager = {
  async onCs2Started() {
    if (!settings.cpuManagement?.enabled) return;

    // CPU Affinity
    if (
      settings.cpuManagement.selectedCores &&
      settings.cpuManagement.selectedCores.length > 0
    ) {
      const pids = runningProcesses.getPidsForName("cs2.exe");
      const selectedCores = settings.cpuManagement.selectedCores;

      for (const pid of pids) {
        if (!affinitySetPids.has(pid)) {
          try {
            await invoke("set_process_affinity", { pid, cores: selectedCores });
            logInfo(
              `[Affinity] Successfully enforced for CS2 (PID ${pid}) with cores [${selectedCores.join(", ")}]`,
            );
            affinitySetPids.add(pid);
          } catch (e) {
            logError(`[Affinity] Failed to set for CS2 (PID ${pid}):`, e);
          }
        }
      }
    }

    // CPU Parking
    if (settings.cpuManagement.preventParking) {
      try {
        await invoke("set_core_parking_status", { acValue: 100, dcValue: 100 });
        logInfo("[CPU Parking] Parking deactivated for CS2");
      } catch (e) {
        logError("[CPU Parking] Failed to deactivate parking:", e);
      }
    }
  },

  async onCs2Stopped() {
    // CPU Parking
    if (
      settings.cpuManagement?.enabled &&
      settings.cpuManagement?.preventParking
    ) {
      try {
        const ac = settings.cpuManagement.defaultAcParking ?? 10;
        const dc = settings.cpuManagement.defaultDcParking ?? 10;
        await invoke("set_core_parking_status", { acValue: ac, dcValue: dc });
        logInfo(
          `[CPU Parking] Restored default parking (AC: ${ac}%, DC: ${dc}%)`,
        );
      } catch (e) {
        logError("[CPU Parking] Failed to restore parking:", e);
      }
    }

    // Cleanup tracking
    affinitySetPids.clear();
  },
};
