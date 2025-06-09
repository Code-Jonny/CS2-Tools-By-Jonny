import { os, filesystem, events } from "@neutralinojs/lib";

// Declare Neutralinojs global variables to satisfy TypeScript
declare const NL_PATH: string;

export interface PowerPlan {
  guid: string;
  name: string;
  isActive: boolean;
}

/**
 * Checks if PowerShell is available on the system PATH.
 * @returns {Promise<boolean>} True if available, otherwise false.
 */
export async function isPowerShellAvailable() {
  try {
    // The 'where' command is a standard utility on Windows to locate executables.
    // It exits with code 0 if found, which Neutralinojs treats as success.
    // It exits with a non-zero code if not found, which causes execCommand to throw an error.
    await os.execCommand("where powershell.exe");
    return true;
  } catch (err) {
    // The command failed, indicating powershell.exe was not found in the PATH.
    console.error(
      "PowerShell check failed: 'where powershell.exe' was not successful.",
      err
    );
    return false;
  }
}

/**
 * Checks if the PowerShell execution policy is permissive enough to run local scripts.
 * @returns {Promise<boolean>} True if scripts can likely run, otherwise false.
 */
export async function canRunUnsignedScripts() {
  try {
    const { stdOut } = await os.execCommand(
      'powershell -NoProfile -Command "Get-ExecutionPolicy"'
    );

    // The output will be the policy name, e.g., "Restricted\r\n". We trim it to get just the name.
    const policy = stdOut.trim();

    // These policies will block unsigned, local scripts from running.
    const restrictivePolicies = ["Restricted", "AllSigned", "Undefined"];

    // If the current policy is NOT in the restrictive list, we are good to go.
    // Your script will be called with `-ExecutionPolicy Bypass`, but this check
    // ensures that the system isn't completely locked down by a Group Policy.
    return !restrictivePolicies.includes(policy);
  } catch (err) {
    // This would happen if the Get-ExecutionPolicy command itself fails for some reason.
    console.error("Failed to get PowerShell execution policy.", err);
    return false;
  }
}

function isActivePlan(guid: string, plans: PowerPlan[]): boolean {
  return plans.some((plan) => plan.guid === guid && plan.isActive);
}

export async function getPowerPlans() {
  try {
    const powerPlans: PowerPlan[] = [];

    const scriptPath = `${NL_PATH}\\app\\get_powerplans.ps1`;

    const command = `powershell -ExecutionPolicy Bypass -NoProfile -File "${scriptPath}"`;
    const result = await os.execCommand(command);

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
