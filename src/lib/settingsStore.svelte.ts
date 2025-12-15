/**
 * @file settingsStore.svelte.ts
 * @description Manages application settings using Svelte 5's reactive state ($state).
 * Persists changes to Tauri Store via a Proxy.
 */

import { getItem, setItem, hasItem } from "./storage";

// Define the default structure and values for your application settings
export const defaultAppSettings = {
  autostartWithWindows: false,
  startMinimized: false,
  pollingIntervalMs: 5000,
  processesToKill: [] as string[],
  powerPlanCS2: {
    name: "",
    guid: "",
  },
  powerPlanDefault: {
    name: "",
    guid: "",
  },
  powerPlanManagementActive: false,
  processManagementActive: false,
};

export type AppSettings = typeof defaultAppSettings;

// Internal reactive state using Svelte 5's $state
const _internalSettings = $state<AppSettings>(
  JSON.parse(JSON.stringify(defaultAppSettings))
);

// Flag to prevent proxy from saving during initial load
let isLoading = false;

// Helper to update state without triggering type errors
function updateState<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
) {
  _internalSettings[key] = value;
}

// Proxy handler to intercept assignments
const settingsProxyHandler: ProxyHandler<AppSettings> = {
  set: (target, propertyKey: keyof AppSettings, value) => {
    // Update the reactive state
    updateState(propertyKey, value);

    // Auto-save if not currently loading
    if (!isLoading) {
      setItem(propertyKey as string, value).catch((err) => {
        console.error(`Failed to save setting ${String(propertyKey)}:`, err);
      });
    }
    return true;
  },
  get: (target, propertyKey: keyof AppSettings) => {
    return _internalSettings[propertyKey];
  },
};

// Export the proxy
export const settings: AppSettings = new Proxy(
  _internalSettings,
  settingsProxyHandler
);

/**
 * Loads settings from storage.
 */
export async function loadAndInitializeSettings() {
  isLoading = true;
  try {
    for (const key of Object.keys(defaultAppSettings) as Array<
      keyof AppSettings
    >) {
      if (await hasItem(key)) {
        const storedValue = await getItem<AppSettings[typeof key]>(key);
        if (storedValue !== null && storedValue !== undefined) {
          updateState(key, storedValue);
        } else {
          // If key exists but is null/undefined, revert to default
          updateState(key, defaultAppSettings[key]);
        }
      } else {
        // Initialize missing keys with defaults
        await setItem(key, defaultAppSettings[key]);
        updateState(key, defaultAppSettings[key]);
      }
    }
    console.log("Settings loaded successfully");
  } catch (error) {
    console.error("Error loading settings:", error);
  } finally {
    isLoading = false;
  }
}

/**
 * Resets all settings to their default values.
 */
export async function resetToDefaults() {
  isLoading = true; // Prevent auto-save during reset loop
  try {
    for (const key of Object.keys(defaultAppSettings) as Array<
      keyof AppSettings
    >) {
      const defaultValue = defaultAppSettings[key];
      updateState(key, defaultValue);
      await setItem(key, defaultValue);
    }
    console.log("Settings reset to defaults");
  } catch (error) {
    console.error("Error resetting settings:", error);
  } finally {
    isLoading = false;
  }
}
