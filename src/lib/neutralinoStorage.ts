/**
 * @file neutralinoStorage.ts
 * @description Wrapper functions for Tauri Store API.
 * Provides simplified async methods to save, retrieve, and check for data existence.
 */

import { Store } from "@tauri-apps/plugin-store";

const store = new Store("settings.json");
let isLoaded = false;

async function ensureLoaded() {
  if (!isLoaded) {
    try {
      await store.load();
      isLoaded = true;
    } catch (error) {
      console.error("Failed to load settings store:", error);
      // If load fails (e.g. file doesn't exist yet), we might still want to proceed
      // so we can save new settings.
      isLoaded = true;
    }
  }
}

export async function saveData(key: string, value: any): Promise<void> {
  try {
    await ensureLoaded();
    await store.set(key, value);
    await store.save();
  } catch (error) {
    console.error(`Error saving data for key "${key}":`, error);
    throw error;
  }
}

export async function getData<T>(
  key: string,
  defaultValue?: T
): Promise<T | undefined> {
  try {
    await ensureLoaded();
    const value = await store.get<T>(key);
    if (value === null || value === undefined) {
      return defaultValue;
    }
    return value;
  } catch (error) {
    console.error(`Error retrieving data for key "${key}":`, error);
    return defaultValue;
  }
}

export async function exists(key: string): Promise<boolean> {
  try {
    await ensureLoaded();
    return await store.has(key);
  } catch (error) {
    console.error(`Error checking existence for key "${key}":`, error);
    return false;
  }
}
