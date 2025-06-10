<script lang="ts">
  import Button from "@elements/Button.svelte"; // Add this import
  import { settings } from "@lib/settingsStore.svelte.ts";
  import {
    runningProcesses,
    type ProcessInfo,
    type FilterType,
    type SortKey,
    type SortOrder,
  } from "@lib/runningProcesses.svelte.ts";
  import { onMount } from "svelte";

  let filter: FilterType = $state("all"); // Default filter to show all processes
  let sortKey: SortKey = $state("name");
  let sortOrder: SortOrder = $state("asc");
  let searchTerm: string = $state(""); // Added for search functionality

  async function getProcessList() {
    await runningProcesses.refresh();
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      sortOrder = sortOrder === "asc" ? "desc" : "asc";
    } else {
      sortKey = key;
      sortOrder = "asc";
    }
  }

  // Reactive statement for displayed processes
  const displayedProcesses = $derived(
    (() => {
      const allProcesses = $runningProcesses.processes.slice(); // React to store changes, work with a copy

      // Apply filter
      let processesToGroup = allProcesses;
      if (filter !== "all") {
        processesToGroup = processesToGroup.filter((p: ProcessInfo) =>
          filter === "service" ? p.service : !p.service
        );
      }

      // Apply search term
      if (searchTerm && searchTerm.trim() !== "") {
        const lowerSearchTerm = searchTerm.toLowerCase();
        processesToGroup = processesToGroup.filter((p: ProcessInfo) =>
          p.name.toLowerCase().includes(lowerSearchTerm)
        );
      }

      // Grouping logic
      const grouped = processesToGroup.reduce(
        (
          acc: Record<
            string,
            {
              name: string;
              count: number;
              ramUsage: number;
              types: Set<boolean>;
            }
          >,
          process: ProcessInfo
        ) => {
          if (!acc[process.name]) {
            acc[process.name] = {
              name: process.name,
              count: 0,
              ramUsage: 0,
              types: new Set<boolean>(), // true for service, false for app
            };
          }
          acc[process.name].count++;
          acc[process.name].ramUsage += process.ramUsage;
          acc[process.name].types.add(process.service);
          return acc;
        },
        {} as Record<
          string,
          { name: string; count: number; ramUsage: number; types: Set<boolean> }
        >
      );

      // Transform grouped data for display
      let result = Object.values(grouped).map(
        (group: {
          name: string;
          count: number;
          ramUsage: number;
          types: Set<boolean>;
        }) => {
          let typeDisplay = "";
          const hasService = group.types.has(true);
          const hasApp = group.types.has(false);

          if (hasService && hasApp) {
            typeDisplay = "App & Service";
          } else if (hasService) {
            typeDisplay = "Service";
          } else if (hasApp) {
            typeDisplay = "App";
          } else {
            typeDisplay = "Unknown"; // Should not happen if processes always have a defined type
          }
          return {
            nameForActionAndSort: group.name, // For unique key, sorting by name, and actions
            displayName:
              group.count > 1 ? `${group.name} (${group.count}x)` : group.name,
            count: group.count,
            ramUsage: group.ramUsage,
            typeDisplay: typeDisplay,
          };
        }
      );

      // Apply current sort (sortKey, sortOrder) to the grouped results
      // PID sorting is removed from UI.
      // Assert the type of sortKey for current context, as it's controlled by UI to be one of these.
      const currentSortKey = sortKey as "name" | "ramUsage" | "service";

      result.sort((a, b) => {
        let valA, valB;
        switch (currentSortKey) {
          case "name":
            valA = a.nameForActionAndSort.toLowerCase();
            valB = b.nameForActionAndSort.toLowerCase();
            break;
          case "ramUsage":
            valA = a.ramUsage;
            valB = b.ramUsage;
            break;
          case "service": // Sorting by the displayed type string
            valA = a.typeDisplay.toLowerCase();
            valB = b.typeDisplay.toLowerCase();
            break;
          default:
            return 0;
        }

        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });

      return result;
    })()
  );

  const errorMessage = $derived($runningProcesses.errorMessage);

  function convertBytesToHumanReadable(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }

  onMount(async () => {
    await getProcessList();
  });
</script>

<h3>Process List</h3>

<Button onclick={getProcessList}>Refresh</Button>

<Button
  onclick={() => {
    filter = "service";
  }}>Only Services</Button
>

<Button
  onclick={() => {
    filter = "app";
  }}>Only Apps</Button
>

<Button
  onclick={() => {
    filter = "all";
  }}>All types</Button
>

<input
  type="text"
  placeholder="Search by name..."
  bind:value={searchTerm}
  style="margin-left: 10px;"
/>

{#if errorMessage}
  <p class="error">{errorMessage}</p>
{/if}
<table>
  <thead>
    <tr>
      <th onclick={() => handleSort("name")}>Name</th>
      <th onclick={() => handleSort("service")}>Type</th>
      <th onclick={() => handleSort("ramUsage")}>RAM Usage</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {#each displayedProcesses as process (process.nameForActionAndSort)}
      <tr>
        <td>{process.displayName}</td>
        <td>{process.typeDisplay}</td>
        <td>{convertBytesToHumanReadable(process.ramUsage)}</td>
        <td>
          {#if settings.processesToKill.includes(process.nameForActionAndSort)}
            <Button
              onclick={() => {
                settings.processesToKill = settings.processesToKill.filter(
                  (name) => name !== process.nameForActionAndSort
                );
              }}
            >
              Remove from kill list
            </Button>
          {:else}
            <Button
              onclick={() => {
                settings.processesToKill = [
                  ...settings.processesToKill,
                  process.nameForActionAndSort, // Use the base name for the kill list
                ];
              }}
            >
              Add to kill list
            </Button>
          {/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>
