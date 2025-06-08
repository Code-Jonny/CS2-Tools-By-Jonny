<script lang="ts">
  import { os } from "@neutralinojs/lib";

  interface ProcessInfo {
    name: string;
    pid: number;
    ramUsage: number; // RAM usage in bytes
  }

  let processes: ProcessInfo[] = [];
  let errorMessage: string = "";
  let filter: "service" | "app" | "all" = "all"; // Default filter to show all processes

  interface ProcessInfo {
    name: string;
    pid: number;
    ramUsage: number; // RAM usage in bytes
    service: boolean;
  }

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
      processes = [];
    }

    return processes;
  }

  async function filterProcessesByType(type: "service" | "app" | "all") {
    if (type !== "service" && type !== "app" && type !== "all") {
      throw new Error(
        "Invalid type specified. Use 'service', 'app', or 'all'."
      );
    }
    let filteredProcesses = await getProcessList();
    if (type === "service") {
      processes = filteredProcesses.filter((p) => p.service);
    } else if (type === "app") {
      processes = filteredProcesses.filter((p) => !p.service);
    } else {
      processes = filteredProcesses;
    }
  }

  // Call it on component mount or via a button click
  import { onMount } from "svelte";
  onMount(async () => {
    await getProcessList();
  });
</script>

<h3>Process List</h3>

<button
  on:click={() => {
    filterProcessesByType(filter);
  }}>Refresh</button
>

<button
  on:click={() => {
    filter = "service";
    filterProcessesByType(filter);
  }}>Only Services</button
>

<button
  on:click={() => {
    filter = "app";
    filterProcessesByType(filter);
  }}>Only Apps</button
>

<button
  on:click={() => {
    filter = "all";
    filterProcessesByType(filter);
  }}>All types</button
>

{#if errorMessage}
  <p class="error">{errorMessage}</p>
{/if}
<table>
  <tbody>
    {#each processes as process}
      <tr>
        <td>{process.name}</td>
        <td>{process.service ? "Service" : "App"}</td>
        <td>{process.pid}</td>
        <td>{process.ramUsage}</td>
      </tr>
    {/each}
  </tbody>
</table>
