import { terminateProcess } from "@lib/terminateProcess";
import { runningProcesses } from "@lib/runningProcesses";
import { settings } from "@lib/settingsStore";
import { logError } from "@lib/logger";

export const processKiller = {
  async onCs2Started() {
    if (
      !settings.processManagementActive ||
      !settings.processesToKill ||
      settings.processesToKill.length === 0
    ) {
      return;
    }

    try {
      for (const processName of settings.processesToKill) {
        const pids = runningProcesses.getPidsForName(processName);
        for (const pid of pids) {
          await terminateProcess(pid);
        }
      }
    } catch (e) {
      logError("Error in process killer:", e);
    }
  },
};
