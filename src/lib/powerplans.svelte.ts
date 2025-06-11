import { os, filesystem, events } from "@neutralinojs/lib";

// Declare Neutralinojs global variables to satisfy TypeScript
declare const NL_PATH: string;

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
    const absoluteNLPath = await filesystem.getAbsolutePath(NL_PATH);
    const windowsPath = absoluteNLPath.replace(/\//g, "\\");
    const binaryPath = `${NL_PATH}\\power_plans.exe`;

    const result = await os.execCommand(binaryPath);

    if (result.exitCode !== 0) {
      const errorMessage = `Failed to execute power plans command: ${
        result.stdErr || result.stdOut || "Unknown error"
      }`;
      console.error(errorMessage, result);
      store.error = errorMessage;
      store.plans = [];
      return;
    }

    if (!result.stdOut || result.stdOut.trim() === "") {
      const errorMessage = "Power plans command returned empty output.";
      console.error(errorMessage);
      store.error = errorMessage;
      store.plans = [];
      return;
    }

    let jsonOutput;
    try {
      jsonOutput = JSON.parse(result.stdOut.trim());
    } catch (parseError: any) {
      const errorMessage = `Failed to parse power plans JSON output: ${parseError.message}. Output: ${result.stdOut}`;
      console.error(errorMessage, parseError);
      store.error = errorMessage;
      store.plans = [];
      return;
    }

    if (!Array.isArray(jsonOutput)) {
      const errorMessage = "Power plans output is not an array.";
      console.error(errorMessage, jsonOutput);
      store.error = errorMessage;
      store.plans = [];
      return;
    }

    for (const plan of jsonOutput) {
      if (
        typeof plan.guid === "string" &&
        typeof plan.name === "string" &&
        typeof plan.isActive === "boolean"
      ) {
        powerPlansResult.push({
          guid: plan.guid,
          name: plan.name,
          isActive: plan.isActive,
        });
      } else {
        console.warn("Skipping malformed power plan object:", plan);
      }
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
    // Indicate loading state during set operation.
    // The subsequent refresh call will also manage isLoading, but setting it here provides immediate feedback.
    store.isLoading = true;
    store.error = null; // Clear previous errors

    const guid = typeof planOrGuid === "string" ? planOrGuid : planOrGuid.guid;

    // If GUID is empty, it means "Not yet chosen" or no specific plan should be active.
    // In this case, we don't attempt to set a power plan via powercfg.
    // We just refresh the list to ensure the UI reflects the actual current state.
    if (guid === "") {
      console.log("setActive called with empty GUID, nothing to do.");
      // await _fetchAndUpdatePowerPlansInternal();
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
        // Refresh to get the actual state, as the set operation might have failed or OS reverted.
        await _fetchAndUpdatePowerPlansInternal();
        return;
      }

      // If successful, dispatch event. The event listener will handle the refresh.
      events.dispatch("powerPlanChanged", guid);
      // The event listener calls _fetchAndUpdatePowerPlansInternal, which will set isLoading = false.
      // If there's a concern about the event listener's timing, an explicit await _fetchAndUpdatePowerPlansInternal();
      // could be added here, but it might lead to double refresh if the event is quick.
      // For now, relying on the event listener.
    } catch (error: any) {
      const errorMessage = `Critical error in setActivePowerPlan: ${
        error.message || "Unknown error"
      }`;
      console.error(errorMessage, error);
      store.error = errorMessage;
      // Refresh to ensure UI reflects the actual state after error
      await _fetchAndUpdatePowerPlansInternal();
    }
    // Note: isLoading is primarily managed by _fetchAndUpdatePowerPlansInternal.
    // If setActive completes a path without calling it (e.g., successful set relying purely on event),
    // ensure isLoading is correctly handled. However, all paths currently call it or rely on event that calls it.
  },
};

events.on("powerPlanChanged", async (event) => {
  console.log(
    "Neutralino event 'powerPlanChanged' received, refreshing power plans.",
    event?.detail
  );
  await _fetchAndUpdatePowerPlansInternal();
});
