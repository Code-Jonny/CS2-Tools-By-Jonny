<script lang="ts">
  import Button from "@elements/Button.svelte"; // Add this import
  import TextInput from "@elements/TextInput.svelte"; // Importing TextInput component
  import { settings } from "@lib/settingsStore.svelte.ts";
  import {
    runningProcesses,
    type ProcessInfo,
    type FilterType,
    type SortKey,
    type SortOrder,
  } from "@lib/runningProcesses.svelte.ts";
  import { onMount } from "svelte";
  import Icon from "@iconify/svelte";

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

<div class="process-list-container">
  <div class="controls-header">
    <div class="filter-controls">
      <Button
        variant={filter === "all" ? "primary" : "secondary"}
        onclick={() => (filter = "all")}
        icon="solar:list-linear"
      >
        All
      </Button>
      <Button
        variant={filter === "app" ? "primary" : "secondary"}
        onclick={() => (filter = "app")}
        icon="solar:application-linear"
      >
        Apps
      </Button>
      <Button
        variant={filter === "service" ? "primary" : "secondary"}
        onclick={() => (filter = "service")}
        icon="solar:server-linear"
      >
        Services
      </Button>
    </div>
    <div class="search-refresh-controls">
      <TextInput
        bind:value={searchTerm}
        placeholder="Search by name..."
        icon="solar:magnifer-linear"
      />
      <Button
        onclick={getProcessList}
        variant="secondary"
        icon="solar:refresh-linear"
      >
        Refresh
      </Button>
    </div>
  </div>

  {#if errorMessage}
    <p class="error-message">
      <Icon icon="solar:danger-triangle-linear" width="20" height="20" />
      {errorMessage}
    </p>
  {/if}

  <div class="table-container">
    <table class="process-table">
      <thead>
        <tr>
          <th onclick={() => handleSort("name")}
            >Name <Icon
              icon={sortKey === "name"
                ? sortOrder === "asc"
                  ? "solar:arrow-down-linear"
                  : "solar:arrow-up-linear"
                : "solar:sort-vertical-linear"}
              width="16"
              height="16"
            />
          </th>
          <th onclick={() => handleSort("service")}
            >Type <Icon
              icon={sortKey === "service"
                ? sortOrder === "asc"
                  ? "solar:arrow-down-linear"
                  : "solar:arrow-up-linear"
                : "solar:sort-vertical-linear"}
              width="16"
              height="16"
            />
          </th>
          <th onclick={() => handleSort("ramUsage")}
            >RAM <Icon
              icon={sortKey === "ramUsage"
                ? sortOrder === "asc"
                  ? "solar:arrow-down-linear"
                  : "solar:arrow-up-linear"
                : "solar:sort-vertical-linear"}
              width="16"
              height="16"
            />
          </th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#if displayedProcesses.length === 0 && !errorMessage}
          <tr>
            <td colspan="4" class="no-data-message"
              >No processes found matching your criteria.</td
            >
          </tr>
        {/if}
        {#each displayedProcesses as process (process.nameForActionAndSort)}
          <tr>
            <td>{process.displayName}</td>
            <td>{process.typeDisplay}</td>
            <td>{convertBytesToHumanReadable(process.ramUsage)}</td>
            <td class="action-buttons">
              {#if settings.processesToKill.includes(process.nameForActionAndSort)}
                <Button
                  variant="danger"
                  onclick={() => {
                    settings.processesToKill = settings.processesToKill.filter(
                      (name) => name !== process.nameForActionAndSort
                    );
                  }}
                  icon="solar:minus-circle-linear"
                >
                  Remove from Kill List
                </Button>
              {:else}
                <Button
                  variant="success"
                  onclick={() => {
                    settings.processesToKill = [
                      ...settings.processesToKill,
                      process.nameForActionAndSort,
                    ];
                  }}
                  icon="solar:add-circle-linear"
                >
                  Add to Kill List
                </Button>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
  .process-list-container {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .controls-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
    padding: 10px;
    background-color: var(
      --background-primary
    ); /* Slightly different from card to stand out or match */
    border-radius: var(--window-corner-radius);
    flex-wrap: wrap; /* Allow wrapping on smaller screens */
  }

  .filter-controls,
  .search-refresh-controls {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  /* Assuming TextInput has its own styling, adjust if needed */
  /* :global(input[type="text"]) for TextInput might be needed if not styled internally */

  .error-message {
    color: var(--error-color);
    background-color: rgba(var(--error-color-rgb, 220, 53, 69), 0.1);
    padding: 10px;
    border-radius: var(--window-corner-radius);
    border: 1px solid var(--error-color);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .table-container {
    overflow-x: auto; /* Allow horizontal scrolling for table if needed */
  }

  .process-table {
    width: 100%;
    border-collapse: collapse;
    background-color: var(--background-secondary);
    border-radius: var(--window-corner-radius);
    overflow: hidden; /* Ensures border-radius is respected by table contents */
  }

  .process-table th,
  .process-table td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid var(--background-primary);
    color: var(--text-primary);
  }

  .process-table th {
    font-size: 14px; /* Labels & Captions */
    font-weight: 600; /* Inter Semi-Bold */
    color: var(--text-secondary);
    cursor: pointer;
    user-select: none;
    background-color: var(--background-primary); /* Header background */
  }
  .process-table th:hover {
    color: var(--primary-accent);
  }
  .process-table th Icon {
    margin-left: 5px;
  }

  .process-table tbody tr:nth-child(even) {
    background-color: var(--background-primary); /* Zebra striping */
  }

  .process-table tbody tr:hover {
    background-color: var(
      --primary-accent-translucent,
      rgba(0, 191, 255, 0.1)
    ); /* Use a translucent accent for hover */
  }

  .process-table td {
    font-size: 16px; /* Body Text */
  }

  .action-buttons {
    display: flex;
    gap: 8px;
  }
  .action-buttons :global(button) {
    padding: 6px 10px; /* Smaller buttons for table actions */
    font-size: 14px;
  }

  .no-data-message {
    text-align: center;
    padding: 20px;
    color: var(--text-secondary);
    font-style: italic;
  }

  /* Add this to your :root in app.css if you want to use rgba with CSS variables easily */
  /* :root { --error-color-rgb: 220, 53, 69; --primary-accent-rgb: 0, 191, 255; } */
  /* Then use like: background-color: rgba(var(--primary-accent-rgb), 0.1); */
</style>
