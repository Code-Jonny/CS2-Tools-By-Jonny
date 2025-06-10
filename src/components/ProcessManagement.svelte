<script lang="ts">
  import { settings } from "@lib/settingsStore.svelte.ts";
  import ProcessList from "@components/ProcessList.svelte";
</script>

<div class="container">
  <h2>Process Management</h2>
  <form onsubmit={(e) => e.preventDefault()}>
    {#if settings.processesToKill && settings.processesToKill.length > 0}
      <div style="margin-top: 1rem;">
        <h4>Processes to Kill:</h4>
        <ul>
          {#each settings.processesToKill as processName, index ("process-to-kill-" + index)}
            <li>
              {processName}
              <button
                type="button"
                onclick={() => {
                  settings.processesToKill = settings.processesToKill.filter(
                    (_: string, i: number) => i !== index
                  );
                }}
                style="margin-left: 8px;"
              >
                Remove
              </button>
            </li>
          {/each}
        </ul>
      </div>
    {:else}
      <p style="margin-top: 1rem;">No processes configured to be killed.</p>
    {/if}
  </form>
  <hr />
  <ProcessList />
</div>

<style scoped>
  hr {
    margin-top: 20px;
    margin-bottom: 20px;
  }
  .container {
    /* Add any specific styles for this component if needed */
  }
  button {
    margin-right: 10px;
    padding: 10px 15px;
  }
</style>
