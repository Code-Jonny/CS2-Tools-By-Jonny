import { reactive, watch, ref } from "vue";
import { getItem, setItem, hasItem } from "./storage";

// Define the default structure and values for your application settings
export const defaultAppSettings = {
  autostartWithWindows: false,
  startMinimized: false,
  minimizeToTray: true,
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
  vibranceSettings: {
    enabled: false,
    defaultVibrance: 50,
    cs2Vibrance: 100,
  },
  cpuAffinity: {
    enabled: false,
    selectedCores: [] as number[],
  },
};

export type AppSettings = typeof defaultAppSettings;

// Internal reactive state
export const settings = reactive<AppSettings>(
  JSON.parse(JSON.stringify(defaultAppSettings)),
);

export const isSettingsLoaded = ref(false);
let isLoading = true;

// Watch deeply and save keys
watch(
  settings,
  async (newSettings) => {
    if (isLoading) return;
    for (const key of Object.keys(defaultAppSettings) as Array<
      keyof AppSettings
    >) {
      // Optimization idea: only save if changed. accessing store might be slow if we do it for all keys.
      // But for now, ensuring persistence is safer.
      // A real optimization would be to maintain a copy of last saved state and diff it.
      try {
        await setItem(key, newSettings[key]);
      } catch (e) {
        console.error(`Error saving ${key}`, e);
      }
    }
  },
  { deep: true },
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
        const storedValue = await getItem(key);
        if (storedValue !== null && storedValue !== undefined) {
          (settings as any)[key] = storedValue;
        } else {
          (settings as any)[key] = defaultAppSettings[key];
        }
      } else {
        await setItem(key, defaultAppSettings[key]);
      }
    }
  } catch (err) {
    console.error("Failed to load settings:", err);
  } finally {
    isLoading = false;
    isSettingsLoaded.value = true;
  }
}
