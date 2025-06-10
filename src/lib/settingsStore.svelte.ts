import { saveData, getData, exists } from "./neutralinoStorage";

// Define the default structure and values for your application settings
export const defaultAppSettings = {
  autostartWithWindows: false, // Added autostart setting
  pollingInterval: 5000, // Default polling interval in milliseconds
  processesToKill: [] as string[], // Explicitly type as string[]
  powerPlanCS2: {
    name: "Khorvie's PowerPlan",
    guid: "2745DBB2-2B26-4F90-BDA4-4B8F050EB15C",
  },
  powerPlanDefault: {
    name: "Ausbalanciert",
    guid: "381B4222-F694-41F0-9685-FF5BB260DF2E",
  },
  runCS2OnHighPriority: true,
  closeLaucherOnGameStart: true,
  powerPlanManagementActive: false, // Default value for the new setting
};

export type AppSettings = typeof defaultAppSettings;

// Helper function to satisfy TypeScript's indexed assignment rules with $state
function setTypedStateValue<K extends keyof AppSettings>(
  stateObject: AppSettings, // The $state proxy itself
  key: K,
  value: AppSettings[K]
) {
  stateObject[key] = value;
}

// Internal reactive state using Svelte 5's $state
// Initialize with a deep copy of defaults.
const _internalSettings = $state<AppSettings>(
  JSON.parse(JSON.stringify(defaultAppSettings))
);

// Flag to prevent proxy from saving during initial load or reset phases
let isProgrammaticChange = false;

// Proxy handler to intercept assignments to settings properties
const settingsProxyHandler: ProxyHandler<AppSettings> = {
  set: (target, propertyKey: keyof AppSettings, value) => {
    // Update the underlying $state object. This will trigger Svelte's reactivity.
    setTypedStateValue(_internalSettings, propertyKey, value);

    if (!isProgrammaticChange) {
      // console.log(`Proxy: Auto-saving setting ${String(propertyKey)}:`, value);
      saveData(propertyKey, value).catch((err) => {
        console.error(
          `Error auto-saving setting ${String(propertyKey)} via proxy:`,
          err
        );
      });
    }
    return true; // Indicate success for the set operation
  },
  get: (target, propertyKey: keyof AppSettings) => {
    return _internalSettings[propertyKey]; // Get value from the underlying $state object
  },
  // If you need to support `delete settings.someProperty` or `for...in` loops / Object.keys()
  // directly on the `settings` proxy, you might need to implement
  // `deleteProperty`, `ownKeys`, `getOwnPropertyDescriptor` handlers.
  // For typical bind:value and direct property access, get/set are sufficient.
};

// Export the proxy. Components will interact with this.
export const settings: AppSettings = new Proxy(
  _internalSettings, // Pass the $state object itself, not a copy
  settingsProxyHandler
);

/**
 * Loads settings from storage or initializes them with defaults.
 */
async function loadAndInitializeSettings() {
  isProgrammaticChange = true;
  try {
    for (const key of Object.keys(defaultAppSettings) as Array<
      keyof AppSettings
    >) {
      if (await exists(key)) {
        const storedValue = await getData<AppSettings[typeof key]>(key);
        if (storedValue !== undefined) {
          // Assign via proxy; isProgrammaticChange prevents auto-save here
          setTypedStateValue(settings, key, storedValue);
        } else {
          // Key exists but value is undefined (e.g., corrupt data), use default and save it
          setTypedStateValue(settings, key, defaultAppSettings[key]);
          await saveData(key, defaultAppSettings[key]); // Explicit save for this case
        }
      } else {
        // Key does not exist, use default and save it
        setTypedStateValue(settings, key, defaultAppSettings[key]);
        await saveData(key, defaultAppSettings[key]); // Explicit save for this case
      }
    }
    // console.log("Settings loaded and initialized:", JSON.parse(JSON.stringify(_internalSettings)));
  } catch (error) {
    console.error("Error loading and initializing settings:", error);
  } finally {
    isProgrammaticChange = false;
  }
}

/**
 * Resets all application settings to their default values.
 * It updates the reactive state via the proxy and saves the defaults to storage.
 */
export async function resetToDefaults() {
  console.log("Resetting settings to defaults...");
  isProgrammaticChange = true;
  try {
    for (const key of Object.keys(defaultAppSettings) as Array<
      keyof AppSettings
    >) {
      const defaultValue = defaultAppSettings[key];
      setTypedStateValue(settings, key, defaultValue); // Set via proxy
      // Explicitly save each default during reset, as proxy won't auto-save due to isProgrammaticChange
      await saveData(key, defaultValue);
    }
    console.log(
      "Settings have been reset to defaults and saved:",
      JSON.parse(JSON.stringify(_internalSettings)) // Log a snapshot of the internal state
    );
  } catch (error) {
    console.error("Error resetting settings to defaults:", error);
  } finally {
    isProgrammaticChange = false;
  }
}

// Automatically load and initialize settings when this module is imported.
loadAndInitializeSettings();
