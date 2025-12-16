<script lang="ts">
  import { onMount } from "svelte";
  import { invoke } from "@tauri-apps/api/core";
  import { settings } from "@lib/settingsStore.svelte.ts";
  import Card from "@elements/Card.svelte";
  import Toggle from "@elements/Toggle.svelte";
  import ContentBox from "@elements/ContentBox.svelte";
  import Button from "@elements/Button.svelte";
  import Icon from "@iconify/svelte";

  let cpuCount = $state(0);
  let loading = $state(true);

  onMount(async () => {
    try {
      cpuCount = await invoke("get_cpu_count");
    } catch (e) {
      console.error("Failed to get CPU count:", e);
    } finally {
      loading = false;
    }
  });

  function toggleCore(coreIndex: number) {
    if (settings.cpuAffinity.selectedCores.includes(coreIndex)) {
      settings.cpuAffinity.selectedCores =
        settings.cpuAffinity.selectedCores.filter((c) => c !== coreIndex);
    } else {
      settings.cpuAffinity.selectedCores = [
        ...settings.cpuAffinity.selectedCores,
        coreIndex,
      ].sort((a, b) => a - b);
    }
  }

  function selectOptimized() {
    // Select all except 0 and 1
    const cores = [];
    for (let i = 2; i < cpuCount; i++) {
      cores.push(i);
    }
    settings.cpuAffinity.selectedCores = cores;
  }

  function selectAll() {
    const cores = [];
    for (let i = 0; i < cpuCount; i++) {
      cores.push(i);
    }
    settings.cpuAffinity.selectedCores = cores;
  }
</script>

<div class="cpu-affinity-container">
  <h1>CPU Core Affinity</h1>

  <ContentBox>
    <Toggle
      bind:checked={settings.cpuAffinity.enabled}
      id="affinity-toggle"
      label="Enable CPU Affinity Management"
    />
  </ContentBox>

  {#if settings.cpuAffinity.enabled}
    <Card title="Configure CPU Cores" icon="solar:cpu-linear">
      {#if loading}
        <p>Loading CPU info...</p>
      {:else}
        <div class="controls">
          <Button
            variant="primary"
            onclick={selectOptimized}
            icon="solar:magic-stick-3-linear"
          >
            Optimize (Skip Core 0 & 1)
          </Button>
          <Button
            variant="secondary"
            onclick={selectAll}
            icon="solar:check-square-linear"
          >
            Select All
          </Button>
        </div>

        <div class="core-grid">
          {#each Array(cpuCount) as _, i}
            <button
              class="core-box {settings.cpuAffinity.selectedCores.includes(i)
                ? 'selected'
                : ''}"
              onclick={() => toggleCore(i)}
              aria-label="Toggle Core {i}"
            >
              <span class="core-label">Core {i}</span>
              {#if settings.cpuAffinity.selectedCores.includes(i)}
                <Icon icon="solar:check-circle-bold" width="20" height="20" />
              {:else}
                <span class="unchecked-icon">
                  <Icon icon="solar:circle-linear" width="20" height="20" />
                </span>
              {/if}
            </button>
          {/each}
        </div>
        <p class="info-text">
          <Icon icon="solar:info-circle-line" width="16" height="16" />
          Selected cores will be assigned to CS2 when it starts.
        </p>
      {/if}
    </Card>
  {/if}
</div>

<style>
  .cpu-affinity-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .controls {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
  }

  .core-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 10px;
  }

  .core-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 15px;
    background-color: var(--background-primary);
    border: 1px solid var(--background-secondary);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    color: var(--text-primary);
    gap: 8px;
  }

  .core-box:hover {
    border-color: var(--primary-accent);
    background-color: var(--background-secondary);
  }

  .core-box.selected {
    background-color: rgba(0, 191, 255, 0.1); /* Primary accent with opacity */
    border-color: var(--primary-accent);
    color: var(--primary-accent);
  }

  .core-label {
    font-weight: 500;
  }

  .unchecked-icon {
    color: var(--text-secondary);
    display: flex;
  }

  .info-text {
    margin-top: 20px;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: 8px;
    font-style: italic;
  }
</style>
