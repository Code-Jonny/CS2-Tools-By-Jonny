<script setup lang="ts">
  import { settings } from "@lib/settingsStore";
  import ProcessList from "@components/ProcessList.vue";
  import Button from "@elements/Button.vue";
  import Toggle from "@elements/Toggle.vue";
  import Card from "@elements/Card.vue";
  import HelpCard from "@elements/HelpCard.vue";
  import ContentBox from "@elements/ContentBox.vue";
  import TextInput from "@elements/TextInput.vue";
  import { isProcessProtected } from "@lib/processUtils";
  import { ref } from "vue";

  const manualProcessName = ref("");
  const errorMessage = ref("");

  function handleAddManualProcess() {
    errorMessage.value = "";
    const trimmedName = manualProcessName.value.trim();

    if (!trimmedName) {
      errorMessage.value = "Process name cannot be empty.";
      return;
    }

    if (!trimmedName.toLowerCase().endsWith(".exe")) {
      errorMessage.value = "Process name must end with .exe";
      return;
    }

    if (isProcessProtected(trimmedName)) {
      errorMessage.value = `"${trimmedName}" is a protected process and cannot be added.`;
      return;
    }

    if (
      settings.processesToKill.some(
        (p) => p.toLowerCase() === trimmedName.toLowerCase()
      )
    ) {
      errorMessage.value = `"${trimmedName}" is already in the list.`;
      return;
    }

    settings.processesToKill.push(trimmedName);
    manualProcessName.value = "";
  }

  function removeProcess(index: number) {
    settings.processesToKill.splice(index, 1);
  }
</script>

<template>
  <div class="process-management-container">
    <h1>Process Management</h1>

    <ContentBox>
      <Toggle label="Enable Process Management" id="processManagementActive"
              name="processManagementActive"
              v-model:checked="settings.processManagementActive" />
    </ContentBox>

    <template v-if="settings.processManagementActive">
      <Card title="Processes to Kill When CS2 is Running" titleTag="h3">
        <ul v-if="settings.processesToKill && settings.processesToKill.length > 0"
            class="kill-list">
          <li v-for="(processName, index) in settings.processesToKill"
              :key="'kill-' + index" class="kill-list-item">
            <span>{{ processName }}</span>
            <Button type="button" variant="danger" @click="removeProcess(index)"
                    icon="trashbin" size="small" />
          </li>
        </ul>
        <p v-else class="info-text">No processes configured to be killed.</p>
      </Card>

      <Card title="Manually Add Process to Kill List" titleTag="h3">
        <div class="manual-add-process-form">
          <TextInput label="Process Name (e.g., chrome.exe)"
                     id="manualProcessName" name="manualProcessName"
                     v-model="manualProcessName"
                     placeholder="Enter process name..."
                     @input="errorMessage = ''" @submit="handleAddManualProcess"
                     :error="errorMessage || undefined" />
          <Button type="button" variant="primary"
                  @click="handleAddManualProcess" icon="add-circle">
            Add
          </Button>
        </div>
      </Card>

      <Card title="Running Processes" icon="tasks">
        <p class="section-description">
          Find running processes and add them to your kill list.
        </p>
        <ProcessList />
      </Card>
    </template>

    <div v-else class="placeholder-info">
      <p>Enable Process Management to automatically close selected applications
        when
        CS2 starts.</p>
    </div>

    <HelpCard icon="questionmark">
      <p>
        When enabled, the applications you specify in the kill list will be
        automatically closed when Counter-Strike 2 starts. This can help improve
        performance by freeing up system resources.
      </p>
      <p>
        Use the "Running Processes" section to find currently running
        applications
        and add them to your kill list, or manually enter process names below.
      </p>
      <p>
        <strong>Important:</strong> Be cautious when adding processes to the
        kill
        list. Avoid adding critical system processes or applications you need
        running, as they will be forcibly closed when CS2 starts. That can lead
        to data loss or system instability. Always double-check the process
        names you add to ensure they are safe to close. Only a few known
        processes are already blacklisted and cannot be added to prevent
        accidental issues.
      </p>

      <div class="rating">
        <h3>Placebo Rating: 3 / 10</h3>
        <div class="ratingcontent">
          <p>Depending on how much bloatware is installed on your system,
            terminating background processes can improve performance. Don't
            think
            only about CPU and RAM usage; some background processes can also
            affect
            disk and network performance.</p>
        </div>
      </div>
    </HelpCard>
  </div>


</template>

<style scoped>
  .process-management-container {
    display: flex;
    flex-direction: column;
    gap: 25px;
  }

  .kill-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;

  }

  .kill-list-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: var(--background-primary);
    padding: 5px 15px;
    border-radius: var(--window-corner-radius);
    border: 1px solid var(--background-secondary);
    font-size: 13px;
    line-height: 1;
  }

  .info-text {
    color: var(--text-secondary);
    font-style: italic;
  }

  .manual-add-process-form {
    display: flex;
    align-items: flex-end;
    /* Align button with input field */
    gap: 10px;
  }

  .section-description {
    margin-bottom: 15px;
    color: var(--text-secondary);
  }

  .placeholder-info {
    padding: 40px;
    text-align: center;
    color: var(--text-secondary);
    opacity: 0.7;
  }
</style>
