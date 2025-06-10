<script lang="ts">
  import { settings } from "@lib/settingsStore.svelte.ts";
  import ProcessList from "@components/ProcessList.svelte";
  import Button from "@elements/Button.svelte";
  import Toggle from "@elements/Toggle.svelte";
</script>

<div class="process-management-container">
  <h2>Process Management</h2>

  <div class="setting-item toggle-setting">
    <Toggle
      label="Enable Process Management"
      id="processManagementActive"
      name="processManagementActive"
      bind:checked={settings.processManagementActive}
    />
  </div>

  {#if settings.processManagementActive}
    <div class="kill-list-section card-style">
      <h3>Processes to Kill When CS2 is Running</h3>
      {#if settings.processesToKill && settings.processesToKill.length > 0}
        <ul class="kill-list">
          {#each settings.processesToKill as processName, index ("process-to-kill-" + index)}
            <li class="kill-list-item">
              <span>{processName}</span>
              <Button
                type="button"
                variant="danger"
                onclick={() => {
                  settings.processesToKill = settings.processesToKill.filter(
                    (_: string, i: number) => i !== index
                  );
                }}
                icon="solar:trash-bin-minimalistic-linear"
              />
            </li>
          {/each}
        </ul>
      {:else}
        <p class="info-text">No processes configured to be killed.</p>
      {/if}
    </div>

    <div class="process-list-section card-style">
      <h3>Add Processes to Kill List</h3>
      <ProcessList />
    </div>
  {/if}
</div>

<style>
  .process-management-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .setting-item {
    background-color: var(--background-secondary);
    padding: 15px;
    border-radius: var(--window-corner-radius);
  }

  .card-style {
    background-color: var(--background-secondary);
    padding: 20px;
    border-radius: var(--window-corner-radius);
  }

  .kill-list-section h3,
  .process-list-section h3 {
    color: var(--primary-accent);
    margin-bottom: 15px;
    font-size: 18px; /* H3 Card/Item Title */
  }

  .kill-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .kill-list-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid var(--background-primary);
    font-size: 16px;
  }

  .kill-list-item:last-child {
    border-bottom: none;
  }

  .kill-list-item span {
    color: var(--text-primary);
  }

  /* Button component will have its own styling for variants like 'danger' */

  .info-text {
    color: var(--text-secondary);
    font-style: italic;
    margin-top: 10px;
  }

  /* Ensure hr is styled if it were used, but it was removed in favor of card separation */
</style>
