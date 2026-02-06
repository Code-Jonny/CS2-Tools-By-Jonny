<script setup lang="ts">
  import { onMounted, ref } from "vue";
  import { invoke } from "@tauri-apps/api/core";
  import { settings } from "@lib/settingsStore";
  import Card from "@elements/Card.vue";
  import Toggle from "@elements/Toggle.vue";
  import ContentBox from "@elements/ContentBox.vue";
  import Icon from "@icons/Icon.vue";

  const hasNvidiaGpu = ref(false);
  const checkingGpu = ref(true);

  onMounted(async () => {
    try {
      hasNvidiaGpu.value = await invoke<boolean>("check_nvidia_gpu");
      // hasNvidiaGpu.value = false; // Test fallback
    } catch (e) {
      console.error("Failed to check Nvidia GPU:", e);
    } finally {
      checkingGpu.value = false;
    }
  });
</script>

<template>
  <div class="vibrance-management-container">
    <h1>Nvidia Digital Vibrance</h1>

    <div v-if="checkingGpu" class="status-message">Checking for Nvidia GPU...
    </div>
    <ContentBox v-else-if="!hasNvidiaGpu">
      <div class="error-container">
        <Icon iconName="danger-triangle" size="24" class="text-warning" />
        <p>
          No Nvidia GPU detected. This module requires an Nvidia GPU with
          drivers installed.
        </p>
      </div>
    </ContentBox>
    <div v-else>
      <ContentBox>
        <Toggle v-model:checked="settings.vibranceSettings.enabled"
                id="vibrance-toggle" label="Enable Vibrance Management" />
      </ContentBox>

      <Card v-if="settings.vibranceSettings.enabled"
            title="Configure Vibrance Levels" icon="monitor">
        <div class="controls-column">
          <!-- Default Vibrance -->
          <div class="control-group">
            <div class="control-header">
              <div class="label-group">
                <label for="default-vibrance">Default Vibrance (Desktop)</label>
                <span class="default-hint">Nvidia default: 50</span>
              </div>
              <input type="number" min="0" max="100"
                     v-model.number="settings.vibranceSettings.defaultVibrance"
                     class="number-input" />
            </div>
            <input id="default-vibrance" type="range" min="0" max="100"
                   v-model.number="settings.vibranceSettings.defaultVibrance"
                   class="slider-input" />
          </div>

          <!-- CS2 Vibrance -->
          <div class="control-group">
            <div class="control-header">
              <label for="cs2-vibrance">CS2 Vibrance (In-Game)</label>
              <input type="number" min="0" max="100"
                     v-model.number="settings.vibranceSettings.cs2Vibrance"
                     class="number-input" />
            </div>
            <input id="cs2-vibrance" type="range" min="0" max="100"
                   v-model.number="settings.vibranceSettings.cs2Vibrance"
                   class="slider-input" />
          </div>
        </div>
      </Card>

      <div v-else class="placeholder-info">
        <Icon iconName="info-circle" size="48"
              style="color: var(--text-secondary); opacity: 0.5;" />
        <p>Enable Vibrance Management to automatically set Digital Vibrance when
          CS2 starts.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .vibrance-management-container {
    display: flex;
    flex-direction: column;
    gap: 25px;
  }

  .status-message {
    font-size: 18px;
    color: var(--text-secondary);
  }

  .error-container {
    display: flex;
    gap: 15px;
    align-items: center;
    color: var(--text-primary);
  }

  .text-warning {
    color: var(--warning-color, #FFC107);
    flex-shrink: 0;
  }

  .controls-column {
    display: flex;
    flex-direction: column;
    gap: 30px;
    /* Space between the two sliders */
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .control-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }

  .label-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  label {
    font-size: 16px;
    font-weight: 500;
  }

  .default-hint {
    font-size: 12px;
    color: var(--text-secondary);
  }

  .number-input {
    background-color: var(--background-primary);
    border: 1px solid var(--text-secondary);
    color: var(--text-primary);
    width: 60px;
    padding: 5px;
    border-radius: 4px;
    text-align: center;
    font-family: var(--font-family-inter);
  }

  .number-input:focus {
    outline: none;
    border-color: var(--primary-accent);
  }

  /* Slider Styling */
  .slider-input {
    -webkit-appearance: none;
    width: 100%;
    height: 6px;
    background: var(--background-primary);
    border-radius: 3px;
    outline: none;
    cursor: pointer;
  }

  .slider-input::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--primary-accent);
    cursor: pointer;
    transition: transform 0.1s;
  }

  .slider-input::-webkit-slider-thumb:hover {
    transform: scale(1.1);
  }

  .placeholder-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    text-align: center;
    color: var(--text-secondary);
    gap: 15px;
  }
</style>
