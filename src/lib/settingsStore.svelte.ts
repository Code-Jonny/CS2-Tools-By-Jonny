import { saveData, getData, exists } from "./neutralinoStorage";
// import { storage as neutralinoJsStorageAPI } from "@neutralinojs/lib"; // Not needed if not using a direct removeData

// Define the default structure and values for your application settings
export const defaultAppSettings = {
  setting1: "Default Store Value 1",
  setting2: "Default Store Value 2",
  // theme: 'dark',
  // notificationsEnabled: true,
};

export type AppSettings = typeof defaultAppSettings;

let isInitializing = true; // Flag to prevent proxy from saving during initial load or reset phases

// Internal reactive state using Svelte 5's $state
// This should work in a .svelte.ts file that Svelte's preprocessor handles.
const _internalSettings = $state<AppSettings>(
  JSON.parse(JSON.stringify(defaultAppSettings))
);

// Proxy handler to intercept assignments to settings properties
const settingsProxyHandler: ProxyHandler<AppSettings> = {
  set: (target, propertyKey: string, value) => {
    const typedKey = propertyKey as keyof AppSettings;

    // Update the underlying $state object. This will trigger Svelte's reactivity.
    _internalSettings[typedKey] = value;

    if (!isInitializing) {
      // console.log(`Proxy: Auto-saving setting ${typedKey}:`, value);
      saveData(typedKey, value).catch((err) => {
        console.error(`Error auto-saving setting ${typedKey} via proxy:`, err);
      });
    }
    return true; // Indicate success for the set operation
  },
  get: (target, propertyKey: string) => {
    const typedKey = propertyKey as keyof AppSettings;
    return _internalSettings[typedKey]; // Get value from the underlying $state object
  },
};

// Export the proxy. Components will interact with this.
export const settings: AppSettings = new Proxy(
  _internalSettings,
  settingsProxyHandler
);

/**
 * Loads settings from storage or initializes them with defaults.
 * This function is called automatically when the module is imported.
 */
async function loadAndInitializeSettings() {
  console.log("Initializing settings module (Proxy version)...");
  isInitializing = true; // Prevent proxy's save logic during this phase

  for (const key in defaultAppSettings) {
    const typedKey = key as keyof AppSettings;
    if (await exists(typedKey)) {
      const storedValue = await getData<AppSettings[typeof typedKey]>(typedKey);
      if (storedValue !== undefined) {
        _internalSettings[typedKey] = storedValue; // Directly update internal state
      } else {
        // Key exists but value is undefined (e.g., corrupt data), use default and save it
        _internalSettings[typedKey] = defaultAppSettings[typedKey];
        await saveData(typedKey, defaultAppSettings[typedKey]);
      }
    } else {
      // Key does not exist, use default and save it
      _internalSettings[typedKey] = defaultAppSettings[typedKey];
      await saveData(typedKey, defaultAppSettings[typedKey]);
    }
  }

  isInitializing = false; // Initialization complete, proxy can now save changes
  console.log(
    "Settings module initialized. Current settings:",
    JSON.parse(JSON.stringify(_internalSettings))
  );
}

/**
 * Resets all application settings to their default values.
 * It clears the existing settings from storage and saves the defaults.
 */
export async function resetToDefaults() {
  console.log("Resetting settings to defaults...");
  isInitializing = true; // Temporarily disable proxy's auto-save during reset

  try {
    for (const key in defaultAppSettings) {
      const typedKey = key as keyof AppSettings;
      const defaultValue = defaultAppSettings[typedKey];
      // Update reactive state directly
      _internalSettings[typedKey] = defaultValue;
      // Save the default value to storage, effectively overwriting any existing value.
      await saveData(typedKey, defaultValue);
    }
    console.log(
      "Settings have been reset to defaults and saved:",
      JSON.parse(JSON.stringify(_internalSettings))
    );
  } catch (error) {
    console.error("Error resetting settings to defaults:", error);
  } finally {
    isInitializing = false; // Re-enable proxy's auto-save for subsequent user changes
  }
}

// Automatically load and initialize settings when this module is imported.
loadAndInitializeSettings();
