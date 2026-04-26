import { invoke } from "@tauri-apps/api/core";
import { logInfo, logError } from "@lib/logger";
import { settings } from "@lib/settingsStore";

let lastCs2Display: string | null = null;

export const vibranceManager = {
  async onCs2Stopped() {
    if (!settings.vibranceSettings?.enabled) return;

    try {
      if (lastCs2Display) {
        await invoke("apply_vibrance", {
          displayName: lastCs2Display,
          level: settings.vibranceSettings.defaultVibrance,
        });
        logInfo(
          `[Vibrance] CS2 in background. Applied default vibrance ${settings.vibranceSettings.defaultVibrance} to ${lastCs2Display}`,
        );
        lastCs2Display = null;
      } else {
        await invoke("apply_vibrance_to_focused_display", {
          level: settings.vibranceSettings.defaultVibrance,
        });
        logInfo(
          `[Vibrance] CS2 in background. Applied default vibrance ${settings.vibranceSettings.defaultVibrance}`,
        );
      }
    } catch (e) {
      logError("Error reseting vibrance on stop:", e);
    }
  },

  async onForeground() {
    if (!settings.vibranceSettings?.enabled) return;

    try {
      lastCs2Display = await invoke("apply_vibrance_to_focused_display", {
        level: settings.vibranceSettings.cs2Vibrance,
      });
      logInfo(
        `[Vibrance] CS2 in foreground. Applied CS2 vibrance ${settings.vibranceSettings.cs2Vibrance} to ${lastCs2Display}`,
      );
    } catch (e) {
      logError("Error applying vibrance on foreground:", e);
    }
  },

  async onBackground() {
    if (!settings.vibranceSettings?.enabled) return;

    try {
      if (lastCs2Display) {
        await invoke("apply_vibrance", {
          displayName: lastCs2Display,
          level: settings.vibranceSettings.defaultVibrance,
        });
        logInfo(
          `[Vibrance] CS2 not in foreground. Applied default vibrance ${settings.vibranceSettings.defaultVibrance} to ${lastCs2Display}`,
        );
        lastCs2Display = null;
      } else {
        await invoke("apply_vibrance_to_focused_display", {
          level: settings.vibranceSettings.defaultVibrance,
        });
        logInfo(
          `[Vibrance] CS2 not in foreground. Applied default vibrance ${settings.vibranceSettings.defaultVibrance}`,
        );
      }
    } catch (e) {
      logError("Error applying vibrance on background:", e);
    }
  },
};
