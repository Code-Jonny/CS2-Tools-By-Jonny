<script lang="ts">
  import { onMount } from "svelte";
  import { invoke } from "@tauri-apps/api/core";
  import { settings } from "@lib/settingsStore.svelte.ts";
  import Card from "@elements/Card.svelte";
  import Toggle from "@elements/Toggle.svelte";
  import ContentBox from "@elements/ContentBox.svelte";
  import Icon from "@iconify/svelte";

  let hasNvidiaGpu = $state(false);
  let checkingGpu = $state(true);

  onMount(async () => {
    try {
      hasNvidiaGpu = await invoke("check_nvidia_gpu");
      // hasNvidiaGpu = false;
    } catch (e) {
      console.error("Failed to check Nvidia GPU:", e);
    } finally {
      checkingGpu = false;
    }
  });
</script>

<div class="vibrance-management-container">
  <h1>Nvidia Digital Vibrance</h1>

  {#if checkingGpu}
    <div class="status-message">Checking for Nvidia GPU...</div>
  {:else if !hasNvidiaGpu}
    <ContentBox>
      <div class="error-container">
        <Icon
          icon="solar:danger-triangle-linear"
          width="24"
          height="24"
          class="text-warning"
        />
        <p>
          No Nvidia GPU detected. This module requires an Nvidia GPU with
          drivers installed.
        </p>
      </div>
    </ContentBox>
  {:else}
    <ContentBox>
      <Toggle
        bind:checked={settings.vibranceSettings.enabled}
        id="vibrance-toggle"
        label="Enable Vibrance Management"
      />
    </ContentBox>

    {#if settings.vibranceSettings.enabled}
      <Card
        title="Configure Vibrance Levels"
        icon="solar:monitor-camera-linear"
      >
        <div class="controls-column">
          <!-- Default Vibrance -->
          <div class="control-group">
            <div class="control-header">
              <div class="label-group">
                <label for="default-vibrance">Default Vibrance (Desktop)</label>
                <span class="default-hint">Nvidia default: 50</span>
              </div>
              <input
                type="number"
                min="0"
                max="100"
                bind:value={settings.vibranceSettings.defaultVibrance}
                class="number-input"
              />
            </div>
            <input
              id="default-vibrance"
              type="range"
              min="0"
              max="100"
              bind:value={settings.vibranceSettings.defaultVibrance}
              class="slider-input"
            />
          </div>

          <!-- CS2 Vibrance -->
          <div class="control-group">
            <div class="control-header">
              <label for="cs2-vibrance">CS2 Vibrance (In-Game)</label>
              <input
                type="number"
                min="0"
                max="100"
                bind:value={settings.vibranceSettings.cs2Vibrance}
                class="number-input"
              />
            </div>
            <input
              id="cs2-vibrance"
              type="range"
              min="0"
              max="100"
              bind:value={settings.vibranceSettings.cs2Vibrance}
              class="slider-input"
            />
          </div>

          <p class="info-text">
            <Icon icon="solar:info-circle-line" width="16" height="16" />
            Vibrance will automatically switch when CS2 is in the foreground.
          </p>
        </div>
      </Card>
    {/if}
  {/if}
</div>

<style scoped>
  .status-message {
    padding: 1rem;
    text-align: center;
    color: var(--text-secondary);
  }

  .error-container {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--warning-color);
  }

  .vibrance-management-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .controls-column {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .control-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .label-group {
    display: flex;
    flex-direction: column;
  }

  .default-hint {
    font-size: 0.75rem;
    color: var(--text-secondary);
    font-weight: 400;
  }

  label {
    font-size: 0.9rem;
    color: var(--text-primary);
    font-weight: 500;
  }

  .number-input {
    width: 4rem;
    background-color: var(--background-secondary);
    color: var(--text-primary);
    border: 1px solid var(--text-secondary);
    border-radius: 4px;
    padding: 0.25rem 0.5rem;
    text-align: center;
    font-size: 0.9rem;
    outline: none;
    transition: border-color 0.2s;
  }

  .number-input:focus {
    border-color: var(--primary-accent);
  }

  /* Slider Styling */
  .slider-input {
    width: 100%;
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    cursor: pointer;
    height: 24px;
    display: flex;
    align-items: center;
  }

  /* Slider Track */
  .slider-input::-webkit-slider-runnable-track {
    width: 100%;
    height: 6px;
    background: var(
      --background-primary
    ); /* Darker track for contrast on Card */
    border-radius: 3px;
  }

  /* Slider Thumb */
  .slider-input::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    height: 18px;
    width: 18px;
    border-radius: 50%;
    background: var(--primary-accent);
    margin-top: -6px; /* (track height / 2) - (thumb height / 2) -> 3 - 9 = -6 */
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
    transition: transform 0.1s;
  }

  .slider-input:active::-webkit-slider-thumb {
    transform: scale(1.1);
  }

  .info-text {
    font-size: 0.85rem;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
    padding-top: 1rem;
    border-top: 1px solid var(--background-secondary);
  }
</style>
