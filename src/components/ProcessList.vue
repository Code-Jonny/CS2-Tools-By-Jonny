<script setup lang="ts">
  import Button from "@elements/Button.vue";
  import TextInput from "@elements/TextInput.vue";
  import { settings } from "@lib/settingsStore";
  import { runningProcesses, type ProcessInfo, type FilterType, type SortKey, type SortOrder } from "@lib/runningProcesses";
  import { isProcessProtected } from "@lib/processUtils";
  import { ref, computed } from "vue";
  import { Icon } from "@iconify/vue";

  const filter = ref<FilterType>("all");
  const sortKey = ref<SortKey>("name");
  const sortOrder = ref<SortOrder>("asc");
  const searchTerm = ref("");

  async function getProcessList() {
    await runningProcesses.refresh();
  }

  function handleSort(key: SortKey) {
    if (sortKey.value === key) {
      sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
    } else {
      sortKey.value = key;
      sortOrder.value = "asc";
    }
  }

  function addToKillList(processName: string) {
    if (!settings.processesToKill.includes(processName)) {
      settings.processesToKill.push(processName);
    }
  }

  const displayedProcesses = computed(() => {
    let processesToGroup = [...runningProcesses.processes];

    // Apply search term
    if (searchTerm.value && searchTerm.value.trim() !== "") {
      const lowerSearchTerm = searchTerm.value.toLowerCase();
      processesToGroup = processesToGroup.filter((p: ProcessInfo) =>
        p.name.toLowerCase().includes(lowerSearchTerm)
      );
    }

    // Grouping
    const grouped = processesToGroup.reduce((acc, process) => {
      if (!acc[process.name]) {
        acc[process.name] = {
          name: process.name,
          count: 0,
          memory: 0
        };
      }
      const group = acc[process.name];
      if (group) {
        group.count++;
        group.memory += process.memory;
      }
      return acc;
    }, {} as Record<string, { name: string; count: number; memory: number }>);

    let result = Object.values(grouped).map(group => ({
      nameForActionAndSort: group.name,
      displayName: group.count > 1 ? `${group.name} (${group.count}x)` : group.name,
      count: group.count,
      memory: group.memory
    }));

    // Sorting
    const key = sortKey.value as "name" | "memory";
    result.sort((a, b) => {
      let valA, valB;
      if (key === 'name') {
        valA = a.nameForActionAndSort.toLowerCase();
        valB = b.nameForActionAndSort.toLowerCase();
      } else if (key === 'memory') {
        valA = a.memory;
        valB = b.memory;
      } else {
        return 0;
      }

      if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  });

  function formatMemory(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1024 * 1024 * 1024)
      return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  }
</script>

<template>
  <div class="process-list-container">
    <div class="process-list-controls">
      <div class="search-wrapper">
        <TextInput v-model="searchTerm" placeholder="Search processes..."
                   icon="solar:magnifer-linear" />
      </div>
      <Button variant="secondary" @click="getProcessList"
              icon="solar:refresh-circle-linear">
        Refresh
      </Button>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th @click="handleSort('name')" class="sortable">
              <div class="th-content">
                Process Name
                <Icon v-if="sortKey === 'name'"
                      :icon="sortOrder === 'asc' ? 'solar:sort-from-bottom-to-top-linear' : 'solar:sort-from-top-to-bottom-linear'" />
              </div>
            </th>
            <th @click="handleSort('memory')" class="sortable">
              <div class="th-content">
                Memory
                <Icon v-if="sortKey === 'memory'"
                      :icon="sortOrder === 'asc' ? 'solar:sort-from-bottom-to-top-linear' : 'solar:sort-from-top-to-bottom-linear'" />
              </div>
            </th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="displayedProcesses.length === 0">
            <td colspan="3" class="no-results">No processes found.</td>
          </tr>
          <tr v-for="process in displayedProcesses"
              :key="process.nameForActionAndSort">
            <td>{{ process.displayName }}</td>
            <td>{{ formatMemory(process.memory) }}</td>
            <td>
              <Button v-if="!isProcessProtected(process.nameForActionAndSort) && !settings.processesToKill.includes(process.nameForActionAndSort)"
                      variant="secondary"
                      @click="addToKillList(process.nameForActionAndSort)"
                      icon="solar:add-circle-linear"
                      style="padding: 4px 8px; font-size: 12px;">
                Add to Kill List
              </Button>
              <span v-else-if="settings.processesToKill.includes(process.nameForActionAndSort)"
                    class="added-badge">
                Added
              </span>
              <span v-else class="protected-badge">Protected</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
  .process-list-container {
    display: flex;
    flex-direction: column;
    gap: 15px;
    height: 400px;
    /* Fixed height for scrolling */
  }

  .process-list-controls {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .search-wrapper {
    flex-grow: 1;
  }

  .table-container {
    overflow-y: auto;
    border: 1px solid var(--background-secondary);
    border-radius: var(--window-corner-radius);
    flex-grow: 1;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }

  th,
  td {
    padding: 10px 15px;
    text-align: left;
    border-bottom: 1px solid var(--background-secondary);
  }

  th {
    background-color: var(--background-secondary);
    position: sticky;
    top: 0;
    z-index: 1;
    font-weight: 600;
    color: var(--text-primary);
  }

  th.sortable {
    cursor: pointer;
  }

  th.sortable:hover {
    background-color: #333;
  }

  .th-content {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  tr:hover td {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .no-results {
    text-align: center;
    padding: 20px;
    color: var(--text-secondary);
  }

  .added-badge {
    color: var(--success-color);
    font-size: 12px;
    font-weight: 600;
  }

  .protected-badge {
    color: var(--text-secondary);
    font-size: 12px;
    font-style: italic;
  }
</style>
