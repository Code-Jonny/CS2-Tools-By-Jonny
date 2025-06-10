<script lang="ts">
  import { settings } from "@lib/settingsStore.svelte.ts";
  import ProcessList from "@components/ProcessList.svelte";
  import Button from "@elements/Button.svelte";
</script>

<div class="container">
  <h2>Process Management</h2>

  <div>
    <label for="processManagementActive">Enable Process Management</label>
    <input
      type="checkbox"
      id="processManagementActive"
      name="processManagementActive"
      bind:checked={settings.processManagementActive}
    />
  </div>

  {#if settings.processManagementActive}
    <form onsubmit={(e) => e.preventDefault()}>
      {#if settings.processesToKill && settings.processesToKill.length > 0}
        <div style="margin-top: 1rem;">
          <h4>Processes to Kill:</h4>
          <ul>
            {#each settings.processesToKill as processName, index ("process-to-kill-" + index)}
              <li>
                {processName}
                <Button
                  type="button"
                  onclick={() => {
                    settings.processesToKill = settings.processesToKill.filter(
                      (_: string, i: number) => i !== index
                    );
                  }}
                  style="margin-left: 8px;"
                >
                  Remove
                </Button>
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
  {/if}
</div>

<style scoped>
  hr {
    margin-top: 20px;
    margin-bottom: 20px;
  }
  .container {
    /* Add any specific styles for this component if needed */
  }
  label {
    display: block; /* Ensure label and checkbox are on separate lines or manage layout as needed */
    margin-top: 10px;
  }
  input[type="checkbox"] {
    margin-top: 5px;
    margin-bottom: 10px; /* Consistent margin with other inputs */
    margin-right: 5px; /* Space between checkbox and label text if label is inline */
  }
</style>
