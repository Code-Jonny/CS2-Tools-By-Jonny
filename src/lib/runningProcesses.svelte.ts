/**
 * @file runningProcesses.svelte.ts
 * @description Manages the list of running processes on the system.
 * Uses the `tasklist` command to fetch process information and exposes it via a Svelte store.
 * Provides filtering and searching capabilities.
 */

// filepath: c:\Programmieren\projects\cs2-tools\neutralino\src\lib\runningProcesses.svelte.ts
import { os } from "@neutralinojs/lib";
import { writable, get as svelteGet } from "svelte/store";

export interface ProcessInfo {
  name: string;
  pid: number;
  ramUsage: number; // RAM usage in bytes
  service: boolean;
}

export type FilterType = "service" | "app" | "all";
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
      const command = "tasklist /FO CSV /NH";
      const output = await os.execCommand(command);
      const lines = output.stdOut.trim().split("\r\n");
      const processes = lines
        .map((line) => {
          const parts = line
            .split('","')
            .map((part) => part.replace(/^"|"$/g, ""));
          if (parts.length >= 5) {
            const sessionName = parts[2];
            const sessionNumber = parts[3];
            const isService =
              sessionNumber === "0" && sessionName === "Services";

            return {
              name: parts[0],
              pid: parseInt(parts[1], 10),
              ramUsage:
                parseInt(
                  parts[4]
                    .replace(/\./g, "") // Remove thousand separators (dots)
                    .replace(/\s*K$/i, ""), // Remove " K" suffix, case-insensitive
                  10
                ) * 1024, // Convert Kilobytes to Bytes
              service: isService,
            };
          }

          return null;
        })
        .filter((p) => p !== null) as ProcessInfo[];
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
    const processes = svelteGet(store).processes;
    return processes;
  },

  getFiltered: (
    filter: FilterType = "all",
    sortKey: SortKey = "name",
    sortOrder: SortOrder = "asc"
  ): ProcessInfo[] => {
    let tempProcesses = [...svelteGet(store).processes];

    // 1. Filter by type
    if (filter === "service") {
      tempProcesses = tempProcesses.filter((p) => p.service);
    } else if (filter === "app") {
      tempProcesses = tempProcesses.filter((p) => !p.service);
    }

    // 2. Sort
    if (sortKey) {
      tempProcesses.sort((a, b) => {
        const valA = a[sortKey!];
        const valB = b[sortKey!];

        let comparison = 0;
        if (typeof valA === "string" && typeof valB === "string") {
          comparison = valA.localeCompare(valB);
        } else if (typeof valA === "number" && typeof valB === "number") {
          comparison = valA - valB;
        } else if (typeof valA === "boolean" && typeof valB === "boolean") {
          comparison = valA === valB ? 0 : valA ? -1 : 1;
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
};
