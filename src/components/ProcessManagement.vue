<script setup lang="ts">
  import { settings } from "@lib/settingsStore";
  import ProcessList from "@components/ProcessList.vue";
  import Button from "@elements/Button.vue";
  import Toggle from "@elements/Toggle.vue";
  import Card from "@elements/Card.vue";
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
                    icon="trashbin" />
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
    gap: 8px;
  }

  .kill-list-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: var(--background-primary);
    padding: 10px 15px;
    border-radius: var(--window-corner-radius);
    border: 1px solid var(--background-secondary);
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
