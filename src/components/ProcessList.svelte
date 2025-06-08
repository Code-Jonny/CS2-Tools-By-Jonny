<script lang="ts">
  import { settings } from "@lib/settingsStore.svelte.ts";
  import {
    runningProcesses,
    type ProcessInfo,
    type FilterType,
    type SortKey,
    type SortOrder,
  } from "@lib/runningProcesses.svelte.ts";
  import { onMount } from "svelte";

  let filter: FilterType = "all"; // Default filter to show all processes
  let sortKey: SortKey = "name";
  let sortOrder: SortOrder = "asc";
  let searchTerm: string = ""; // Added for search functionality

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
  $: displayedProcesses =
    ($runningProcesses,
    runningProcesses.getBySearch(searchTerm, filter, sortKey, sortOrder));
  $: errorMessage = $runningProcesses.errorMessage;

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

<button onclick={getProcessList}>Refresh</button>

<button
  onclick={() => {
    filter = "service";
  }}>Only Services</button
>

<button
  onclick={() => {
    filter = "app";
  }}>Only Apps</button
>

<button
  onclick={() => {
    filter = "all";
  }}>All types</button
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
      <th onclick={() => handleSort("pid")}>PID</th>
      <th onclick={() => handleSort("ramUsage")}>RAM Usage</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {#each displayedProcesses as process (process.pid)}
      <tr>
        <td>{process.name}</td>
        <td>{process.service ? "Service" : "App"}</td>
        <td>{process.pid}</td>
        <td>{convertBytesToHumanReadable(process.ramUsage)}</td>
        <td>
          <button
            onclick={() => {
              settings.processesToKill = [
                ...settings.processesToKill,
                process.name,
              ];
            }}
          >
            Add to kill list
          </button>
        </td>
      </tr>
    {/each}
  </tbody>
</table>
