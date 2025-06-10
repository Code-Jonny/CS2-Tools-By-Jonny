<script lang="ts">
  import { settings } from "@lib/settingsStore.svelte.ts";
  import ProcessList from "@components/ProcessList.svelte";
  import Button from "@elements/Button.svelte";
  import Toggle from "@elements/Toggle.svelte";
</script>

<div class="container">
  <h2>Process Management</h2>

  <Toggle
    label="Enable Process Management"
    id="processManagementActive"
    name="processManagementActive"
    bind:checked={settings.processManagementActive}
    checkedChanged={() => {}}
  />

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

<style>
  hr {
    margin-top: 20px;
    margin-bottom: 20px;
  }
  .container {
    /* Add any specific styles for this component if needed */
  }
</style>
