import { listen } from "@tauri-apps/api/event";
import { logInfo, logError } from "@lib/logger";
import { runningProcesses } from "@lib/runningProcesses";

import { cpuManager } from "./features/cpuManager";
import { vibranceManager } from "./features/vibranceManager";
import { processKiller } from "./features/processKiller";
import { powerPlanManager } from "./features/powerPlanManager";

export async function initCs2EventTracking() {
  const unlisteners: (() => void)[] = [];

  try {
    const processListener = await listen("cs2process", async (event) => {
      const status = event.payload as "started" | "stopped";
      logInfo(`[CS2Process] cs2process state changed to: ${status}`);

      try {
        await runningProcesses.refresh();

        if (status === "started") {
          await powerPlanManager.onCs2Started();
          await cpuManager.onCs2Started();
          await processKiller.onCs2Started();
        } else if (status === "stopped") {
          await cpuManager.onCs2Stopped();
          await powerPlanManager.onCs2Stopped();
          await vibranceManager.onCs2Stopped();
        }
      } catch (error) {
        logError("Error in handling CS2 process state:", error);
      }
    });
    unlisteners.push(processListener);

    const windowListener = await listen("cs2window", async (event) => {
      const status = event.payload as "foreground" | "background";
      logInfo(`[CS2Window] cs2window state changed to: ${status}`);

      try {
        if (status === "foreground") {
          await vibranceManager.onForeground();
        } else {
          await vibranceManager.onBackground();
        }
      } catch (error) {
        logError("Error in handling CS2 window state:", error);
      }
    });
    unlisteners.push(windowListener);
  } catch (e) {
    logError("Error initializing event tracking:", e);
  }

  // Return a cleanup function
  return () => {
    unlisteners.forEach((unlisten) => unlisten());
  };
}
