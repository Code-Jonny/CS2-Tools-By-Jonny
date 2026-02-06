<script setup lang="ts">
  import { onMounted, ref } from "vue";
  import { invoke } from "@tauri-apps/api/core";
  import { settings } from "@lib/settingsStore";
  import Card from "@elements/Card.vue";
  import Toggle from "@elements/Toggle.vue";
  import ContentBox from "@elements/ContentBox.vue";
  import Button from "@elements/Button.vue";
  import Icon from "@icons/Icon.vue";

  const cpuCount = ref(0);
  const loading = ref(true);

  onMounted(async () => {
    try {
      const count = await invoke<number>("get_cpu_count");
      // Ensure cpuCount is treated as number
      cpuCount.value = Number(count);
    } catch (e) {
      console.error("Failed to get CPU count:", e);
    } finally {
      loading.value = false;
    }
  });

  function toggleCore(coreIndex: number) {
    const selected = settings.cpuAffinity.selectedCores;
    if (selected.includes(coreIndex)) {
      settings.cpuAffinity.selectedCores = selected.filter((c) => c !== coreIndex);
    } else {
      settings.cpuAffinity.selectedCores = [...selected, coreIndex].sort((a, b) => a - b);
    }
  }

  function selectOptimized() {
    // Select all except 0 and 1
    const cores = [];
    for (let i = 2; i < cpuCount.value; i++) {
      cores.push(i);
    }
    settings.cpuAffinity.selectedCores = cores;
  }

  function selectAll() {
    const cores = [];
    for (let i = 0; i < cpuCount.value; i++) {
      cores.push(i);
    }
    settings.cpuAffinity.selectedCores = cores;
  }
</script>

<template>
  <div class="cpu-affinity-container">
    <h1>CPU Core Affinity</h1>

    <ContentBox>
      <Toggle v-model:checked="settings.cpuAffinity.enabled"
              id="affinity-toggle" label="Enable CPU Affinity Management" />
    </ContentBox>

    <Card v-if="settings.cpuAffinity.enabled" title="Configure CPU Cores"
          icon="cpu">
      <p v-if="loading">Loading CPU info...</p>
      <div v-else>
        <div class="controls">
          <Button variant="primary" @click="selectOptimized" icon="magic-stick">
            Optimize (Skip Core 0 & 1)
          </Button>
          <Button variant="secondary" @click="selectAll" icon="check-circle">
            Use all CPU cores
          </Button>
        </div>

        <div class="core-grid">
          <button v-for="(_, i) in cpuCount" :key="i" class="core-box"
                  :class="{ selected: settings.cpuAffinity.selectedCores.includes(i) }"
                  @click="toggleCore(i)" :aria-label="`Toggle Core ${i}`">
            <span class="core-label">Core {{ i }}</span>
            <Icon v-if="settings.cpuAffinity.selectedCores.includes(i)"
                  iconName="check-circle" size="20" />
            <span v-else class="unchecked-icon"></span>
          </button>
        </div>

        <p class="helper-text">
          Selected cores will be used by CS2. Uncheck Core 0 (and usually Core
          1) to offload system tasks from the game.
        </p>
      </div>
    </Card>

    <div v-else class="placeholder-info">
      <Icon iconName="info-circle" size="48"
            style="color: var(--text-secondary); opacity: 0.5;" />
      <p>Enable CPU Affinity Management to configure which CPU cores CS2 should
        run on.</p>
    </div>

  </div>
</template>

<style scoped>
  .cpu-affinity-container {
    display: flex;
    flex-direction: column;
    gap: 25px;
  }

  .controls {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  .core-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 10px;
    margin-bottom: 20px;
  }

  .core-box {
    background-color: var(--background-primary);
    border: 1px solid var(--text-secondary);
    border-radius: 4px;
    /* Small corner radius for core boxes */
    padding: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s;
    color: var(--text-primary);
    font-family: var(--font-family-inter);
  }

  .core-box:hover {
    background-color: #333;
    /* Slightly lighter than bg-primary */
  }

  .core-box.selected {
    background-color: rgba(0, 191, 255, 0.1);
    /* Cyan tint */
    border-color: var(--primary-accent);
    color: var(--primary-accent);
  }

  .core-label {
    font-weight: 500;
  }

  .unchecked-icon {
    width: 20px;
    height: 20px;
    border: 2px solid var(--text-secondary);
    border-radius: 50%;
    box-sizing: border-box;
  }

  .helper-text {
    color: var(--text-secondary);
    font-size: 14px;
    margin-top: 10px;
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
