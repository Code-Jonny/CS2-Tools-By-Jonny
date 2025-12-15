/**
 * @file runningProcesses.svelte.ts
 * @description Manages the list of running processes on the system.
 * Uses Tauri backend to fetch process information and exposes it via a Svelte store.
 * Provides filtering and searching capabilities.
 */

import { invoke } from "@tauri-apps/api/core";
import { writable, get as svelteGet } from "svelte/store";

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

const initialProcessState: ProcessStoreState = {
  processes: [],
  errorMessage: "",
};

const store = writable<ProcessStoreState>(initialProcessState);

export const runningProcesses = {
  subscribe: store.subscribe,

  refresh: async () => {
    try {
      const processes = await invoke<ProcessInfo[]>("get_processes");
      store.set({ processes, errorMessage: "" });
    } catch (err: any) {
      console.error("[runningProcesses] Error fetching process list:", err);
      store.set({
        processes: [],
        errorMessage: `Failed to fetch process list: ${err.message || err}`,
      });
    }
  },

  get: (): ProcessInfo[] => {
    return svelteGet(store).processes;
  },

  getFiltered: (
    filter: FilterType = "all",
    sortKey: SortKey = "name",
    sortOrder: SortOrder = "asc"
  ): ProcessInfo[] => {
    let tempProcesses = [...svelteGet(store).processes];

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
    sortOrder: SortOrder = "asc"
  ): ProcessInfo[] => {
    let tempProcesses = runningProcesses.getFiltered(
      filter,
      sortKey,
      sortOrder
    );

    if (searchTerm.trim() !== "") {
      const lowerSearchTerm = searchTerm.toLowerCase();
      tempProcesses = tempProcesses.filter((p) =>
        p.name.toLowerCase().includes(lowerSearchTerm)
      );
    }
    return tempProcesses;
  },

  isProcessRunning: (processName: string): boolean => {
    const processes = svelteGet(store).processes;
    return processes.some(
      (p) => p.name.toLowerCase() === processName.toLowerCase()
    );
  },

  getPidsForName: (processName: string): number[] => {
    const processes = svelteGet(store).processes;
    return processes
      .filter((p) => p.name.toLowerCase() === processName.toLowerCase())
      .map((p) => p.pid);
  },
};
