import { getCurrentWindow } from "@tauri-apps/api/window";
import { confirm } from "@tauri-apps/plugin-dialog";
import { exit } from "@tauri-apps/plugin-process";
import { settings, isSettingsLoaded } from "@lib/settingsStore";
import { invoke } from "@tauri-apps/api/core";
import { logInfo, logError } from "@lib/logger";
import { watch } from "vue";

export function initWindowManager() {
  try {
    getCurrentWindow()
      .onCloseRequested(async (event) => {
        if (settings.minimizeOnClose) {
          event.preventDefault();
          await getCurrentWindow().minimize();
          logInfo(
            "[Frontend] Close requested, but minimizeOnClose is enabled. Window minimized instead of closed.",
          );
          return;
        }

        const userConfirmed = await confirm(
          "Are you sure you want to exit CS2 Tools By Jonny?",
        );

        if (userConfirmed) {
          logInfo(
            "[Frontend] Close requested and confirmed. Exiting application.",
          );
          exit();
          return;
        } else {
          event.preventDefault();
          logInfo(
            "[Frontend] Close requested but cancelled by user. Window remains open.",
          );
        }
      })
      .catch((e) => logError("Failed to set onCloseRequested listener", e));

    // Watch minimize to tray
    watch(
      () => settings.minimizeToTray,
      (enabled) => {
        if (!isSettingsLoaded.value) return;
        invoke("set_minimize_to_tray", { enable: enabled }).catch(
          console.error,
        );
      },
    );
  } catch (e) {
    logError("Error initializing window manager:", e);
  }
}
