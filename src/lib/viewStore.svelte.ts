/**
 * @file viewStore.svelte.ts
 * @description Manages the current view (route) of the application.
 * Uses a simple Svelte writable store and listens to hash changes for routing.
 */

import { writable } from "svelte/store";

export type View =
  | "dashboard"
  | "process-management"
  | "power-plan-management"
  | "nvidia-vibrance"
  | "settings";

export const currentView = writable<View>("dashboard");

export function updateView() {
  const hash = window.location.hash.substring(1); // Remove #
  if (hash === "/process-management") {
    currentView.set("process-management");
  } else if (hash === "/power-plan-management") {
    currentView.set("power-plan-management");
  } else if (hash === "/nvidia-vibrance") {
    currentView.set("nvidia-vibrance");
  } else if (hash === "/settings") {
    currentView.set("settings");
  } else {
    // Default to dashboard for '/' or other/empty hashes
    currentView.set("dashboard");
  }
}
