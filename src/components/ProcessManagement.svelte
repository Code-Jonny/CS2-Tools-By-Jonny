<script lang="ts">
  import { settings } from "@lib/settingsStore.svelte.ts";
  import ProcessList from "@components/ProcessList.svelte";
  import Button from "@elements/Button.svelte";
  import Toggle from "@elements/Toggle.svelte";
  import Card from "@elements/Card.svelte"; // Import the new Card component
  import ContentBox from "@elements/ContentBox.svelte"; // Import ContentBox
</script>

<div class="process-management-container">
  <h1>Process Management</h1>

  <ContentBox>
    <Toggle
      label="Enable Process Management"
      id="processManagementActive"
      name="processManagementActive"
      bind:checked={settings.processManagementActive}
    />
  </ContentBox>

  {#if settings.processManagementActive}
    <Card title="Processes to Kill When CS2 is Running" titleTag="h3">
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
    </Card>

    <Card title="Add Processes to Kill List" titleTag="h3">
      <ProcessList />
    </Card>
  {/if}
</div>

<style>
  .process-management-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
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

  .info-text {
    color: var(--text-secondary);
    font-style: italic;
    margin-top: 10px; /* Retained for spacing if needed within card content */
  }
</style>
