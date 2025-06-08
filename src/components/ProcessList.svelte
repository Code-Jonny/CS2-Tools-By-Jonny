<script lang="ts">
  import { os } from "@neutralinojs/lib";
  import { settings } from "@lib/settingsStore.svelte.ts";

  interface ProcessInfo {
    name: string;
    pid: number;
    ramUsage: number; // RAM usage in bytes
    service: boolean;
  }

  let processes: ProcessInfo[] = [];
  let errorMessage: string = "";
  let filter: "service" | "app" | "all" = "all"; // Default filter to show all processes
  let sortKey: keyof ProcessInfo | null = null;
  let sortOrder: "asc" | "desc" = "asc";
  let searchTerm: string = ""; // Added for search functionality

  async function getProcessList() {
    try {
      const command = "tasklist /FO CSV /NH";
      const output = await os.execCommand(command);
      const lines = output.stdOut.trim().split("\r\n");
      processes = lines
        .map((line) => {
          // CSV output is typically: "Image Name","PID","Session Name","Session#","Mem Usage"
          // We need to handle the quotes around each value.
          const parts = line
            .split('","')
            .map((part) => part.replace(/^"|"$/g, ""));
          if (parts.length >= 5) {
            const sessionName = parts[2];
            const sessionNumber = parts[3];
            // A process is generally considered a service if its Session# is 0
            // and Session Name is "Services".
            // Other processes running under Session# 0 might not strictly be "services"
            // in the Windows Services sense (e.g. system processes),
            // but this is a common heuristic.
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
          return null; // Or handle error for malformed lines
        })
        .filter((p) => p !== null) as ProcessInfo[];
      errorMessage = "";
    } catch (err: any) {
      console.error("Error fetching process list:", err);
      errorMessage = `Failed to fetch process list: ${err.message || err}`;
      processes = []; // Clear processes on error
    }
    // No explicit return needed as 'processes' is updated directly
  }

  function handleSort(key: keyof ProcessInfo) {
    if (sortKey === key) {
      sortOrder = sortOrder === "asc" ? "desc" : "asc";
    } else {
      sortKey = key;
      sortOrder = "asc";
    }
    // displayedProcesses will update reactively
  }

  // Reactive statement for displayed processes
  $: displayedProcesses = (() => {
    let tempProcesses = [...processes];

    // 1. Filter by type
    if (filter === "service") {
      tempProcesses = tempProcesses.filter((p) => p.service);
    } else if (filter === "app") {
      tempProcesses = tempProcesses.filter((p) => !p.service);
    }

    // 2. Filter by search term (fuzzy: case-insensitive includes)
    if (searchTerm.trim() !== "") {
      const lowerSearchTerm = searchTerm.toLowerCase();
      tempProcesses = tempProcesses.filter((p) =>
        p.name.toLowerCase().includes(lowerSearchTerm)
      );
    }

    // 3. Sort
    if (sortKey) {
      tempProcesses.sort((a, b) => {
        const valA = a[sortKey!]; // Non-null assertion as sortKey is checked
        const valB = b[sortKey!]; // Non-null assertion

        let comparison = 0;
        if (typeof valA === "string" && typeof valB === "string") {
          comparison = valA.localeCompare(valB);
        } else if (typeof valA === "number" && typeof valB === "number") {
          comparison = valA - valB;
        } else if (typeof valA === "boolean" && typeof valB === "boolean") {
          comparison = valA === valB ? 0 : valA ? -1 : 1; // true before false or vice-versa based on preference
        }
        // Add more type comparisons if needed (e.g., boolean for 'service' column)

        return sortOrder === "asc" ? comparison : -comparison;
      });
    }
    return tempProcesses;
  })();

  function convertBytesToHumanReadable(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }

  // Call it on component mount or via a button click
  import { onMount } from "svelte";
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
