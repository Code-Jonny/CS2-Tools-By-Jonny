/**
 * @file startupUtils.ts
 * @description Utilities for managing application startup behavior.
 * Uses Tauri plugins for autostart and window management.
 */

import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { settings } from "@lib/settingsStore.svelte.ts";

export async function setAutostart(enableAutoStart: boolean): Promise<void> {
  try {
    if (enableAutoStart) {
      await enable();
    } else {
      await disable();
    }
  } catch (error) {
    console.error("Failed to toggle autostart:", error);
    throw error;
  }
}

export async function checkAutostartStatus(): Promise<boolean> {
  try {
    return await isEnabled();
  } catch (error) {
    console.error("Failed to check autostart status:", error);
    return false;
  }
}

export async function applyStartMinimizedSetting(): Promise<void> {
  const appWindow = getCurrentWindow();
  if (settings.startMinimized) {
    try {
      if (settings.minimizeToTray) {
        // Start hidden (in tray)
        // Since window starts hidden (tauri.conf.json visible: false), we don't need to do anything
        console.log("Starting minimized to tray (hidden).");
      } else {
        // Start minimized in taskbar
        // To ensure it appears in taskbar, we might need to show it first or just minimize
        // Trying minimize() directly on hidden window
        await appWindow.minimize();
      }
    } catch (error) {
      console.error("Failed to minimize window:", error);
      await appWindow.show(); // Fallback
    }
  } else {
    // Normal start
    await appWindow.show();
    await appWindow.setFocus();
  }
}
