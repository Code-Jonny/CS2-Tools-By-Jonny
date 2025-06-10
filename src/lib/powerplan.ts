import { os, filesystem, events } from "@neutralinojs/lib";

// Declare Neutralinojs global variables to satisfy TypeScript
declare const NL_PATH: string;

export interface PowerPlan {
  guid: string;
  name: string;
  isActive: boolean;
}

/**
 * Checks if a given power plan is the active one.
 * @param guid - The GUID of the power plan to check.
 * @param plans - An array of PowerPlan objects.
 * @returns {boolean} - Returns true if the plan is active, false otherwise.
 */
function isActivePlan(guid: string, plans: PowerPlan[]): boolean {
  return plans.some((plan) => plan.guid === guid && plan.isActive);
}

export async function getPowerPlans() {
  try {
    const powerPlans: PowerPlan[] = [];

    const absoluteNLPath = await filesystem.getAbsolutePath(NL_PATH);
    const windowsPath = absoluteNLPath.replace(/\//g, "\\");
    const binaryPath = `${windowsPath}\\app\\power_plans.exe`;

    const result = await os.execCommand(binaryPath);

    if (result.exitCode !== 0) {
      console.error("Failed to execute power plans command:", result);
      return powerPlans;
    }

    const jsonOutput = JSON.parse(result.stdOut.trim());

    // Iterate over the JSON output to populate powerPlans array
    for (const plan of jsonOutput) {
      const guid = plan.guid;
      const name = plan.name;
      const isActive = plan.isActive;

      powerPlans.push({ guid, name, isActive });
    }

    /*
    const lines = result.stdOut.trim().split("\n");
    // Regex to find GUID, name, and optionally an asterisk for active plan.
    // This regex looks for:
    // 1. A GUID (e.g., "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX")
    // 2. Followed by one or more spaces
    // 3. Followed by a name enclosed in parentheses (e.g., "(My Power Plan)")
    // 4. Optionally, followed by one or more spaces and an asterisk (e.g., " *")
    const planRegex =
      /([0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12})\s+\((.*?)\)(?:\s+(\*))?/;

    for (const line of lines) {
      // Attempt to match the pattern in each line.
      const match = line.match(planRegex);

      if (match) {
        // match[1] contains the GUID
        // match[2] contains the name
        // match[3] contains '*' if the plan is active, otherwise undefined
        const guid = match[1];
        const name = match[2];
        const isActive = match[3] === "*";

        powerPlans.push({ guid, name, isActive });
      }
    }
    
    */
    return powerPlans;
  } catch (error) {
    console.error("Critical error in getPowerPlans:", error);
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      if (error.stack) {
        console.error("Error stack:", error.stack);
      }
    } else {
      console.error("Non-Error object thrown during execution:", error);
    }
    return [];
  }
}

export async function setActivePowerPlan(guid: string) {
  try {
    const command = `powercfg /setactive ${guid}`;
    await os.execCommand(command);

    events.dispatch("powerPlanChanged", guid);
  } catch (error) {
    console.error("Critical error in setActivePowerPlan:", error);
  }
}
