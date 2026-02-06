import { reactive } from "vue";
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

const state = reactive<PowerPlanState>({
  plans: [],
  isLoading: false,
  error: null,
  lastUpdated: 0,
});

async function _fetchAndUpdatePowerPlansInternal() {
  state.isLoading = true;
  state.error = null;
  try {
    const plans = await invoke<PowerPlan[]>("get_power_plans");
    state.plans = plans;
    state.lastUpdated = Date.now();
  } catch (err: any) {
    console.error("Failed to fetch power plans:", err);
    state.error = String(err);
    state.plans = [];
  } finally {
    state.isLoading = false;
  }
}

export const powerPlans = {
  get plans() {
    return state.plans;
  },
  get isLoading() {
    return state.isLoading;
  },
  get error() {
    return state.error;
  },
  get lastUpdated() {
    return state.lastUpdated;
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
