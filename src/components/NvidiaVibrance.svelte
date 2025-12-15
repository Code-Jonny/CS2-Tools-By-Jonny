<script lang="ts">
  import { onMount } from "svelte";
  import { invoke } from "@tauri-apps/api/core";
  import { settings } from "../lib/settingsStore.svelte";
  import Card from "../elements/Card.svelte";
  import Toggle from "../elements/Toggle.svelte";
  import ContentBox from "../elements/ContentBox.svelte";
  import Icon from "@iconify/svelte";

  let hasNvidiaGpu = $state(false);
  let checkingGpu = $state(true);

  onMount(async () => {
    try {
      hasNvidiaGpu = await invoke("check_nvidia_gpu");
    } catch (e) {
      console.error("Failed to check Nvidia GPU:", e);
    } finally {
      checkingGpu = false;
    }
  });

  $effect(() => {
    // Sync settings to backend whenever they change
    invoke("set_vibrance_settings", {
      enabled: settings.vibranceSettings.enabled,
      defaultVibrance: settings.vibranceSettings.defaultVibrance,
      cs2Vibrance: settings.vibranceSettings.cs2Vibrance,
    }).catch((e) => console.error("Failed to sync vibrance settings:", e));
  });
</script>

<Card title="Nvidia Digital Vibrance" icon="solar:monitor-camera-linear">
  {#if checkingGpu}
    <div class="p-4 text-center text-secondary">Checking for Nvidia GPU...</div>
  {:else if !hasNvidiaGpu}
    <ContentBox>
      <div class="flex items-center gap-3 text-warning">
        <Icon icon="solar:danger-triangle-linear" width="24" height="24" />
        <p>
          No Nvidia GPU detected. This module requires an Nvidia GPU with
          drivers installed.
        </p>
      </div>
    </ContentBox>
  {:else}
    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <span class="text-primary">Enable Vibrance Management</span>
        <Toggle
          bind:checked={settings.vibranceSettings.enabled}
          id="vibrance-toggle"
          label="Enable Vibrance"
        />
      </div>

      {#if settings.vibranceSettings.enabled}
        <ContentBox>
          <div class="flex flex-col gap-6">
            <!-- Default Vibrance -->
            <div class="flex flex-col gap-2">
              <div class="flex justify-between items-center">
                <label for="default-vibrance" class="text-sm text-secondary"
                  >Default Vibrance (Desktop)</label
                >
                <input
                  type="number"
                  min="0"
                  max="100"
                  bind:value={settings.vibranceSettings.defaultVibrance}
                  class="w-16 bg-background-secondary text-text-primary border border-border rounded px-2 py-1 text-right text-sm focus:outline-none focus:border-accent"
                />
              </div>
              <input
                id="default-vibrance"
                type="range"
                min="0"
                max="100"
                bind:value={settings.vibranceSettings.defaultVibrance}
                class="w-full accent-accent h-2 bg-background-primary rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <!-- CS2 Vibrance -->
            <div class="flex flex-col gap-2">
              <div class="flex justify-between items-center">
                <label for="cs2-vibrance" class="text-sm text-secondary"
                  >CS2 Vibrance (In-Game)</label
                >
                <input
                  type="number"
                  min="0"
                  max="100"
                  bind:value={settings.vibranceSettings.cs2Vibrance}
                  class="w-16 bg-background-secondary text-text-primary border border-border rounded px-2 py-1 text-right text-sm focus:outline-none focus:border-accent"
                />
              </div>
              <input
                id="cs2-vibrance"
                type="range"
                min="0"
                max="100"
                bind:value={settings.vibranceSettings.cs2Vibrance}
                class="w-full accent-accent h-2 bg-background-primary rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </ContentBox>

        <p class="text-xs text-secondary mt-2 flex items-center gap-1">
          <Icon icon="solar:info-circle-line" width="14" height="14" />
          Vibrance will automatically switch when CS2 is in the foreground.
        </p>
      {/if}
    </div>
  {/if}
</Card>

<style>
  /* Custom styling for range input to match design */
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: #00bfff; /* Cyan */
    cursor: pointer;
    margin-top: -4px; /* You need to specify a margin in Chrome, but in Firefox and IE it is automatic */
  }

  input[type="range"]::-webkit-slider-runnable-track {
    width: 100%;
    height: 8px;
    cursor: pointer;
    background: #242424;
    border-radius: 4px;
  }
</style>
