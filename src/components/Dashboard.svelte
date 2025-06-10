<script lang="ts">
  import { runningProcesses } from "@lib/runningProcesses.svelte.ts";

  // Reactive state to check if cs2.exe is running
  // The $derived rune creates a memoized value that updates when its dependencies change.
  let isCS2Running = $derived(runningProcesses.isProcessRunning("cs2.exe"));
</script>

<div class="container">
  <h3>Dashboard</h3>
  {#if isCS2Running}
    <p style="color: green; font-weight: bold;">
      Counter-Strike 2 (cs2.exe) is currently running.
    </p>
  {:else}
    <p style="color: red; font-weight: bold;">
      Counter-Strike 2 (cs2.exe) is not running.
    </p>
  {/if}
  <p>This is the main dashboard. More features can be added here.</p>
</div>

<style scoped>
  .container {
    /* Styles for the dashboard container */
    padding: 1em;
  }
  h3 {
    margin-bottom: 0.5em;
    font-size: 1.5em;
  }
  p {
    font-size: 1.1em;
    line-height: 1.6;
  }
</style>
