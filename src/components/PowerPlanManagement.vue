<script setup lang="ts">
  import { settings } from "@lib/settingsStore";
  import { powerPlans, type PowerPlan } from "@lib/powerplans";
  import Toggle from "@elements/Toggle.vue";
  import Card from "@elements/Card.vue";
  import ContentBox from "@elements/ContentBox.vue";
  import Button from "@elements/Button.vue";
  import { ref, watch, onMounted } from 'vue';

  const localAvailablePowerPlans = ref<PowerPlan[]>([]);

  // Sync with store on mount and when refreshed manually
  const refreshAvailablePowerPlans = () => {
    localAvailablePowerPlans.value = [...powerPlans.plans];
  };

  // Also verify if we should auto-update when store changes or only on explicit refresh.
  // Svelte code: `let localAvailablePowerPlans = $state<PowerPlan[]>(powerPlans.plans);`
  // It initializes it. Then `refreshAvailablePowerPlans` (called by button) updates it.
  // It seems the intention is to NOT update automatically?
  // But `powerPlans.plans` starts empty until fetched.
  // So we should probably watch until we have something, or just watch the store.
  // Given the UI has a "Refresh" button (implied by comments), maybe it's explicit.
  // But initial load is async.
  watch(() => powerPlans.plans, (newPlans) => {
    // If local list is empty, take the new ones (initial load)
    if (localAvailablePowerPlans.value.length === 0) {
      localAvailablePowerPlans.value = [...newPlans];
    }
  }, { immediate: true });


  function handlePowerPlanChange(
    event: Event,
    targetSetting: "powerPlanCS2" | "powerPlanDefault"
  ) {
    const select = event.target as HTMLSelectElement;
    const selectedGuid = select.value;

    if (selectedGuid === "") {
      settings[targetSetting] = {
        guid: "",
        name: "",
      };
    } else {
      const selectedPlan = localAvailablePowerPlans.value.find(
        (plan) => plan.guid === selectedGuid
      );
      if (selectedPlan) {
        settings[targetSetting] = {
          guid: selectedPlan.guid,
          name: selectedPlan.name,
        };
      }
    }
  }
</script>

<template>
  <div class="power-plan-management-container">
    <h1>Power Plan Management</h1>

    <ContentBox>
      <Toggle label="Enable Power Plan Management"
              id="powerPlanManagementActive" name="powerPlanManagementActive"
              v-model:checked="settings.powerPlanManagementActive" />
    </ContentBox>

    <Card v-if="settings.powerPlanManagementActive"
          title="Configure Power Plans" icon="solar:bolt-linear">
      <form @submit.prevent class="power-plan-form">
        <div class="form-group">
          <label for="powerPlanCS2">Power Plan for CS2:</label>
          <select id="powerPlanCS2" name="powerPlanCS2"
                  :value="settings.powerPlanCS2?.guid"
                  @change="(e) => handlePowerPlanChange(e, 'powerPlanCS2')"
                  :disabled="powerPlans.isLoading || !!powerPlans.error"
                  class="styled-select">
            <option v-if="powerPlans.error" value="" disabled>Error:
              {{ powerPlans.error }}</option>
            <option v-else-if="localAvailablePowerPlans.length === 0 && !powerPlans.isLoading"
                    value="" disabled>No power plans found. (Try Refresh)
            </option>
            <option v-else-if="powerPlans.isLoading && localAvailablePowerPlans.length === 0"
                    value="" disabled>Loading power plans...</option>
            <template v-else>
              <option value="">Not yet chosen</option>
              <option v-for="plan in localAvailablePowerPlans" :key="plan.guid"
                      :value="plan.guid">
                {{ plan.name }}
              </option>
            </template>
          </select>
        </div>

        <div class="form-group">
          <label for="powerPlanDefault">Default Power Plan (when CS2 is not
            running):</label>
          <select id="powerPlanDefault" name="powerPlanDefault"
                  :value="settings.powerPlanDefault?.guid"
                  @change="(e) => handlePowerPlanChange(e, 'powerPlanDefault')"
                  :disabled="powerPlans.isLoading || !!powerPlans.error"
                  class="styled-select">
            <option v-if="powerPlans.error" value="" disabled>Error:
              {{ powerPlans.error }}
            </option>
            <option v-else-if="localAvailablePowerPlans.length === 0 && !powerPlans.isLoading"
                    value="" disabled>No power plans found. (Try Refresh)
            </option>
            <option v-else-if="powerPlans.isLoading && localAvailablePowerPlans.length === 0"
                    value="" disabled>Loading power plans...</option>
            <template v-else>
              <option value="">Not yet chosen</option>
              <option v-for="plan in localAvailablePowerPlans" :key="plan.guid"
                      :value="plan.guid">
                {{ plan.name }}
              </option>
            </template>
          </select>
        </div>

        <div class="actions">
          <Button variant="secondary"
                  @click="() => { powerPlans.refresh(); refreshAvailablePowerPlans(); }"
                  icon="solar:refresh-circle-linear">
            Refresh Plans
          </Button>
        </div>
      </form>
    </Card>

    <div v-else class="placeholder-info">
      <p>Enable Power Plan Management to automatically switch Windows Power
        Plans
        when CS2 starts and exits.</p>
    </div>
  </div>
</template>

<style scoped>
  .power-plan-management-container {
    display: flex;
    flex-direction: column;
    gap: 25px;
  }

  .power-plan-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  label {
    font-size: 14px;
    font-weight: 500;
  }

  .styled-select {
    padding: 10px;
    border-radius: var(--window-corner-radius);
    background-color: var(--background-primary);
    border: 1px solid var(--text-secondary);
    color: var(--text-primary);
    font-family: var(--font-family-inter);
    font-size: 16px;
    outline: none;
    cursor: pointer;
  }

  .styled-select:focus {
    border-color: var(--primary-accent);
  }

  .styled-select:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
  }

  .placeholder-info {
    padding: 40px;
    text-align: center;
    color: var(--text-secondary);
    opacity: 0.7;
  }
</style>
