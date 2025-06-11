<script lang="ts">
  import { settings } from "@lib/settingsStore.svelte.ts";
  import ProcessList from "@components/ProcessList.svelte";
  import Button from "@elements/Button.svelte";
  import Toggle from "@elements/Toggle.svelte";
  import Card from "@elements/Card.svelte"; // Import the new Card component
  import ContentBox from "@elements/ContentBox.svelte"; // Import ContentBox
  import TextInput from "@elements/TextInput.svelte"; // Import TextInput
  import { isProcessProtected } from "@lib/processUtils.ts"; // Import validation utility

  let manualProcessName = "";
  let errorMessage = ""; // For displaying validation errors

  function handleAddManualProcess() {
    errorMessage = ""; // Reset error message
    const trimmedName = manualProcessName.trim();

    if (!trimmedName) {
      errorMessage = "Process name cannot be empty.";
      return;
    }

    if (!trimmedName.toLowerCase().endsWith(".exe")) {
      errorMessage = "Process name must end with .exe";
      return;
    }

    if (isProcessProtected(trimmedName)) {
      errorMessage = `"${trimmedName}" is a protected process and cannot be added.`;
      return;
    }

    if (
      settings.processesToKill.some(
        (p) => p.toLowerCase() === trimmedName.toLowerCase()
      )
    ) {
      errorMessage = `"${trimmedName}" is already in the list.`;
      return;
    }

    settings.processesToKill = [...settings.processesToKill, trimmedName];
    manualProcessName = ""; // Clear input after adding
  }
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

    <Card title="Manually Add Process to Kill List" titleTag="h3">
      <div class="manual-add-process-form">
        <TextInput
          label="Process Name (e.g., chrome.exe)"
          id="manualProcessName"
          name="manualProcessName"
          bind:value={manualProcessName}
          placeholder="Enter process name..."
          oninput={() => (errorMessage = "")}
          onsubmit={handleAddManualProcess}
        />
        <Button
          type="button"
          variant="primary"
          onclick={handleAddManualProcess}
          icon="solar:add-circle-linear"
        >
          Add Process
        </Button>
        {#if errorMessage}
          <p class="error-message">{errorMessage}</p>
        {/if}
      </div>
    </Card>

    <Card
      title="Add Processes to Kill List from Running Processes"
      titleTag="h3"
    >
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

  .manual-add-process-form {
    display: flex;
    flex-direction: column;
    gap: 15px; /* Spacing between input, button, and error message */
  }

  .manual-add-process-form > :global(.button-component) {
    /* Target Button component */
    align-self: flex-start; /* Align button to the start */
  }

  .error-message {
    color: var(--danger); /* Assuming you have a danger color variable */
    font-size: 0.9em;
    margin-top: 5px;
  }
</style>
