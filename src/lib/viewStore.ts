import { ref } from "vue";

export type View =
  | "dashboard"
  | "process-management"
  | "power-plan-management"
  | "cpu-affinity"
  | "nvidia-vibrance"
  | "settings";

export const currentView = ref<View>("dashboard");

export function updateView() {
  const hash = window.location.hash.substring(1); // Remove #
  const map: Record<string, View> = {
    "/process-management": "process-management",
    "/power-plan-management": "power-plan-management",
    "/cpu-affinity": "cpu-affinity",
    "/nvidia-vibrance": "nvidia-vibrance",
    "/settings": "settings",
  };
  currentView.value = map[hash] || "dashboard";
}
