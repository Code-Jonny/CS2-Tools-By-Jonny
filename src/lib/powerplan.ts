import { os, filesystem, events } from "@neutralinojs/lib";

// Declare Neutralinojs global variables to satisfy TypeScript
declare const NL_PATH: string;

export interface PowerPlan {
  guid: string;
  name: string;
  isActive: boolean;
}

async function readJsonFile(filePath: string) {
  try {
    const content = await filesystem.readFile(filePath);
    return JSON.parse(content);
  } catch (error) {
    console.error("Error reading or parsing JSON file:", error);
    throw error;
  }
}

function isActivePlan(guid: string, plans: PowerPlan[]): boolean {
  return plans.some((plan) => plan.guid === guid && plan.isActive);
}

export async function getPowerPlans() {
  try {
    const powerPlans: PowerPlan[] = [];

    const command = `${NL_PATH}\\app\\power_plans.exe -file \"${NL_PATH}\\power_plans.json\"`;
    const result = await os.execCommand(command);

    const plans = await readJsonFile(`${NL_PATH}\\power_plans.json`);
    if (!Array.isArray(plans)) {
      throw new Error("Invalid power plans data format");
    }
    return plans;
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
    const command = `${NL_PATH}\\app\\power_plans.exe -file \"${NL_PATH}\\power_plans.json\" -setactive "${guid}"`;
    await os.execCommand(command);

    const plans = await readJsonFile(`${NL_PATH}\\power_plans.json`);
    if (!Array.isArray(plans)) {
      throw new Error("Invalid power plans data format");
    }

    if (!isActivePlan(guid, plans)) {
      throw new Error("Something went wrong while setting the power plan");
    }

    events.dispatch("powerPlanChanged", guid);
  } catch (error) {
    console.error("Critical error in setActivePowerPlan:", error);
  }
}
