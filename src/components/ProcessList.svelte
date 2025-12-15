<script lang="ts">
  import Button from "@elements/Button.svelte";
  import TextInput from "@elements/TextInput.svelte";
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
  import { isProcessProtected } from "@lib/processUtils";

  let filter: FilterType = $state("all");
  let sortKey: SortKey = $state("name");
  let sortOrder: SortOrder = $state("asc");
  let searchTerm: string = $state("");

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
      const allProcesses = $runningProcesses.processes.slice();

      // Apply filter (only search now)
      let processesToGroup = allProcesses;

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
              memory: number;
            }
          >,
          process: ProcessInfo
        ) => {
          if (!acc[process.name]) {
            acc[process.name] = {
              name: process.name,
              count: 0,
              memory: 0,
            };
          }
          acc[process.name].count++;
          acc[process.name].memory += process.memory;
          return acc;
        },
        {} as Record<string, { name: string; count: number; memory: number }>
      );

      // Transform grouped data for display
      let result = Object.values(grouped).map(
        (group: { name: string; count: number; memory: number }) => {
          return {
            nameForActionAndSort: group.name,
            displayName:
              group.count > 1 ? `${group.name} (${group.count}x)` : group.name,
            count: group.count,
            memory: group.memory,
          };
        }
      );

      const currentSortKey = sortKey as "name" | "memory";

      result.sort((a, b) => {
        let valA, valB;
        switch (currentSortKey) {
          case "name":
            valA = a.nameForActionAndSort.toLowerCase();
            valB = b.nameForActionAndSort.toLowerCase();
            break;
          case "memory":
            valA = a.memory;
            valB = b.memory;
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

  function addProcessToKillList(processName: string) {
    if (isProcessProtected(processName)) {
      console.warn(
        `Process "${processName}" is protected and cannot be added to the kill list.`
      );
      alert(
        `Process "${processName}" is protected and cannot be added to the kill list.`
      );
      return;
    }
    if (!settings.processesToKill.includes(processName)) {
      settings.processesToKill = [...settings.processesToKill, processName];
    }
  }
</script>

<div class="process-list-container">
  <div class="controls-header">
    <div class="search-controls">
      <TextInput
        bind:value={searchTerm}
        placeholder="Search by name..."
        icon="solar:magnifer-linear"
      />
    </div>
    <div class="filter-refresh-controls">
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
          <th onclick={() => handleSort("name")} class="sortable"
            >Name <Icon
              icon={sortKey === "name"
                ? sortOrder === "asc"
                  ? "solar:arrow-up-bold"
                  : "solar:arrow-down-bold"
                : "solar:sort-vertical-bold"}
              width="16"
              height="16"
            />
          </th>
          <th onclick={() => handleSort("memory")} class="sortable"
            >Memory <Icon
              icon={sortKey === "memory"
                ? sortOrder === "asc"
                  ? "solar:arrow-up-bold"
                  : "solar:arrow-down-bold"
                : "solar:sort-vertical-bold"}
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
            <td colspan="3" class="no-data-message"
              >No processes found matching your criteria.</td
            >
          </tr>
        {/if}
        {#each displayedProcesses as process (process.nameForActionAndSort)}
          <tr>
            <td>{process.displayName}</td>
            <td>{convertBytesToHumanReadable(process.memory)}</td>
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
              {:else if isProcessProtected(process.nameForActionAndSort)}
                Protected
              {:else}
                <Button
                  variant="success"
                  onclick={() =>
                    addProcessToKillList(process.nameForActionAndSort)}
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
    flex-direction: column;
    gap: 10px;
    padding: 10px;
    background-color: var(--background-primary);
    border-radius: var(--window-corner-radius);
  }

  .search-controls {
    display: flex;
    width: 100%;
  }

  .search-controls :global(.text-input-wrapper) {
    flex-grow: 1;
  }

  .filter-refresh-controls {
    display: flex;
    justify-content: flex-end;
  }

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
    overflow-x: auto;
  }

  .process-table {
    width: 100%;
    border-collapse: collapse;
    background-color: var(--background-secondary);
    border-radius: var(--window-corner-radius);
    overflow: hidden;
  }

  .process-table th,
  .process-table td {
    padding: 10px 12px;
    text-align: left;
    border-bottom: 1px solid var(--background-primary);
    color: var(--text-primary);
  }

  .process-table th {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary);
    user-select: none;
    background-color: var(--background-primary);

    &.sortable {
      cursor: pointer;
    }
  }
  .process-table th.sortable:hover {
    color: var(--primary-accent);
  }

  .process-table tbody tr:nth-child(even) {
    background-color: var(--background-primary);
  }

  .process-table tbody tr:hover {
    background-color: var(--primary-accent-translucent, rgba(0, 191, 255, 0.1));
  }

  .process-table td {
    font-size: 14px;
  }

  .action-buttons {
    display: flex;
    gap: 6px;
  }
  .action-buttons :global(button) {
    padding: 5px 8px;
    font-size: 13px;
  }

  .no-data-message {
    text-align: center;
    padding: 15px;
    color: var(--text-secondary);
    font-style: italic;
  }
</style>
