/**
 * @file powerplans.svelte.ts
 * @description Manages Windows Power Plans.
 * Fetches available power plans using Tauri backend and allows switching the active plan.
 * Uses Svelte 5's reactive state to expose the list of plans and current status.
 */

import { invoke } from "@tauri-apps/api/core";

export interface PowerPlan {
  guid: string;
  name: string;
  isActive?: boolean;
}

interface PowerPlanState {
  plans: PowerPlan[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: number;
}

let store = $state<PowerPlanState>({
  plans: [],
  isLoading: false,
  error: null,
  lastUpdated: 0,
});

async function _fetchAndUpdatePowerPlansInternal() {
  store.isLoading = true;
  store.error = null;
  try {
    const plans = await invoke<PowerPlan[]>("get_power_plans");
    store.plans = plans;
    store.lastUpdated = Date.now();
  } catch (err) {
    console.error("Failed to fetch power plans:", err);
    store.error = String(err);
    store.plans = [];
  } finally {
    store.isLoading = false;
  }
}

export const powerPlans = {
  get plans() {
    return store.plans;
  },
  get isLoading() {
    return store.isLoading;
  },
  get error() {
    return store.error;
  },
  get lastUpdated() {
    return store.lastUpdated;
  },
  refresh: _fetchAndUpdatePowerPlansInternal,
  setActive: async (guid: string) => {
    try {
      await invoke("set_active_power_plan", { guid });
      await _fetchAndUpdatePowerPlansInternal();
    } catch (err) {
      console.error("Failed to set active power plan:", err);
      throw err;
    }
  },
};

// Initial fetch
_fetchAndUpdatePowerPlansInternal();
