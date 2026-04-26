import { powerPlans } from "@lib/powerplans";
import { settings } from "@lib/settingsStore";
import { logError } from "@lib/logger";

export const powerPlanManager = {
  async onCs2Started() {
    if (!settings.powerPlanManagementActive || !settings.powerPlanCS2?.guid)
      return;

    try {
      await powerPlans.setActive(settings.powerPlanCS2.guid);
    } catch (e) {
      logError("Error setting CS2 power plan:", e);
    }
  },

  async onCs2Stopped() {
    if (!settings.powerPlanManagementActive || !settings.powerPlanDefault?.guid)
      return;

    try {
      await powerPlans.setActive(settings.powerPlanDefault.guid);
    } catch (e) {
      logError("Error setting default power plan:", e);
    }
  },
};
