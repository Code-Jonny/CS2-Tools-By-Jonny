import { reactive } from "vue";
import { invoke } from "@tauri-apps/api/core";

export interface ProcessInfo {
  name: string;
  pid: number;
  memory: number;
}

export type FilterType = "all";
export type SortKey = keyof ProcessInfo | null;
export type SortOrder = "asc" | "desc";

interface ProcessStoreState {
  processes: ProcessInfo[];
  errorMessage: string;
}

const state = reactive<ProcessStoreState>({
  processes: [],
  errorMessage: "",
});

export const runningProcesses = {
  get processes() {
    return state.processes;
  },
  get errorMessage() {
    return state.errorMessage;
  },

  refresh: async () => {
    try {
      const processes = await invoke<ProcessInfo[]>("get_processes");
      state.processes = processes;
      state.errorMessage = "";
    } catch (err: any) {
      console.error("[runningProcesses] Error fetching process list:", err);
      state.processes = [];
      state.errorMessage = `Failed to fetch process list: ${err.message || err}`;
    }
  },

  get: (): ProcessInfo[] => {
    return state.processes;
  },

  getFiltered: (
    filter: FilterType = "all",
    sortKey: SortKey = "name",
    sortOrder: SortOrder = "asc",
  ): ProcessInfo[] => {
    let tempProcesses = [...state.processes];

    // Sort
    if (sortKey) {
      tempProcesses.sort((a, b) => {
        const valA = a[sortKey!];
        const valB = b[sortKey!];

        let comparison = 0;
        if (typeof valA === "string" && typeof valB === "string") {
          comparison = valA.localeCompare(valB);
        } else if (typeof valA === "number" && typeof valB === "number") {
          comparison = valA - valB;
        }
        return sortOrder === "asc" ? comparison : -comparison;
      });
    }

    return tempProcesses;
  },

  getBySearch: (
    searchTerm: string,
    filter: FilterType = "all",
    sortKey: SortKey = "name",
    sortOrder: SortOrder = "asc",
  ): ProcessInfo[] => {
    let tempProcesses = runningProcesses.getFiltered(
      filter,
      sortKey,
      sortOrder,
    );

    if (searchTerm.trim() !== "") {
      const lowerSearchTerm = searchTerm.toLowerCase();
      tempProcesses = tempProcesses.filter((p) =>
        p.name.toLowerCase().includes(lowerSearchTerm),
      );
    }
    return tempProcesses;
  },

  isProcessRunning: (processName: string): boolean => {
    return state.processes.some(
      (p) => p.name.toLowerCase() === processName.toLowerCase(),
    );
  },

  getPidsForName: (processName: string): number[] => {
    return state.processes
      .filter((p) => p.name.toLowerCase() === processName.toLowerCase())
      .map((p) => p.pid);
  },
};
