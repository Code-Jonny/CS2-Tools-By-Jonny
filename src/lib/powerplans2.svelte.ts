import { os, events } from "@neutralinojs/lib";

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
    const powerPlansResult: PowerPlan[] = [];
    const command = "powercfg /list";
    const result = await os.execCommand(command);

    console.log(result.stdOut); // Debugging output

    if (result.exitCode !== 0) {
      const errorMessage = `Failed to execute 'powercfg /list': ${
        result.stdErr || result.stdOut || "Unknown error"
      }`;
      console.error(errorMessage, result);
      store.error = errorMessage;
      store.plans = [];
      return;
    }

    if (!result.stdOut || result.stdOut.trim() === "") {
      const errorMessage = "'powercfg /list' returned empty output.";
      console.error(errorMessage);
      store.error = errorMessage;
      store.plans = [];
      return;
    }

    const lines = result.stdOut.split("\n");
    // Regex to capture GUID, Name, and optionally the active marker (*)
    // Example line (English): Power Scheme GUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx  (Balanced) *
    // Example line (German):  GUID des Energieschemas: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx  (Ausbalanciert) *
    const planRegex =
      /([0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12})[^\(]*\((.*?)\)(?:\s*(\*))?/;

    for (const line of lines) {
      const match = line.match(planRegex);
      if (match) {
        const guid = match[1];
        const name = match[2];
        const isActive = !!match[3]; // True if the asterisk (capture group 3) is present

        powerPlansResult.push({
          guid,
          name,
          isActive,
        });
      }
    }

    if (powerPlansResult.length === 0 && result.stdOut.trim() !== "") {
      // This case means stdout was not empty, but we couldn't parse any plans.
      // This could be due to a regex mismatch or unexpected output format.
      const errorMessage =
        "Failed to parse any power plans from 'powercfg /list' output. Raw output: " +
        result.stdOut;
      console.warn(errorMessage);
      // Potentially set store.error here if this should be treated as a hard error
      // store.error = errorMessage;
    }

    store.plans = powerPlansResult;
    store.lastUpdated = Date.now();
  } catch (error: any) {
    const errorMessage = `Critical error in _fetchAndUpdatePowerPlansInternal: ${
      error.message || "Unknown error"
    }`;
    console.error(errorMessage, error);
    store.error = errorMessage;
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
  get activePlan() {
    return store.plans.find((p) => p.isActive) || null;
  },
  refresh: async () => {
    await _fetchAndUpdatePowerPlansInternal();
  },
  setActive: async (planOrGuid: string | PowerPlan) => {
    store.isLoading = true;
    store.error = null;

    const guid = typeof planOrGuid === "string" ? planOrGuid : planOrGuid.guid;

    if (guid === "") {
      console.log("setActive called with empty GUID, no action taken.");
      store.isLoading = false; // Reset isLoading as no operation is performed
      return;
    }

    try {
      const command = `powercfg /setactive ${guid}`;
      const result = await os.execCommand(command);

      if (result.exitCode !== 0) {
        const errorMessage = `Failed to set active power plan ${guid}: ${
          result.stdErr || result.stdOut || "Unknown error"
        }`;
        console.error(errorMessage, result);
        store.error = errorMessage;
        await _fetchAndUpdatePowerPlansInternal(); // Refresh to get the actual state
        return;
      }

      // If successful, dispatch event. The event listener will handle the refresh.
      events.dispatch("powerPlanChanged", guid);
      // _fetchAndUpdatePowerPlansInternal will be called by the event listener,
      // which will set isLoading = false.
    } catch (error: any) {
      const errorMessage = `Critical error in setActivePowerPlan: ${
        error.message || "Unknown error"
      }`;
      console.error(errorMessage, error);
      store.error = errorMessage;
      await _fetchAndUpdatePowerPlansInternal(); // Refresh to ensure UI reflects the actual state
    }
  },
};

// Initialize by fetching plans once.
_fetchAndUpdatePowerPlansInternal();

// Listen for external changes or events that might affect power plans
events.on("powerPlanChanged", async (event) => {
  console.log(
    "Neutralino event 'powerPlanChanged' received in powerplans2.svelte.ts, refreshing power plans.",
    event?.detail
  );
  await _fetchAndUpdatePowerPlansInternal();
});

// Potentially listen to system events if NeutralinoJS supports them,
// e.g., system resume, which might alter power plans.
// For now, relies on manual refresh or refresh after setActive.
