/**
 * @file storage.ts
 * @description Handles persistent storage using Tauri's Store plugin.
 */

import { LazyStore } from "@tauri-apps/plugin-store";

// Initialize the store with a filename
const store = new LazyStore("settings.json");
let isStoreLoaded = false;

/**
 * Ensures the store is loaded from disk.
 */
async function ensureStoreLoaded() {
  if (!isStoreLoaded) {
    try {
      await store.init();
      isStoreLoaded = true;
    } catch (error) {
      console.warn("Failed to load store (might be first run):", error);
      // Even if load fails, we mark it as loaded so we can write new data
      isStoreLoaded = true;
    }
  }
}

/**
 * Saves a value to the store.
 * @param key The key to store.
 * @param value The value to store.
 */
export async function setItem<T>(key: string, value: T): Promise<void> {
  await ensureStoreLoaded();
  await store.set(key, value);
  await store.save();
}

/**
 * Retrieves a value from the store.
 * @param key The key to retrieve.
 * @returns The value or null if not found.
 */
export async function getItem<T>(key: string): Promise<T | null> {
  await ensureStoreLoaded();
  return (await store.get<T>(key)) ?? null;
}

/**
 * Checks if a key exists in the store.
 * @param key The key to check.
 */
export async function hasItem(key: string): Promise<boolean> {
  await ensureStoreLoaded();
  return await store.has(key);
}
