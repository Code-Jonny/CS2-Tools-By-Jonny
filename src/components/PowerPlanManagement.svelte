<script lang="ts">
  import { settings } from "@lib/settingsStore.svelte.ts";
  import { powerPlans, type PowerPlan } from "@lib/powerplans.svelte.ts";
  import Toggle from "@elements/Toggle.svelte"; // Added import for Toggle component
  import Icon from "@iconify/svelte";

  // Changed: Use $state for local component state, initialized with current plans from the store.
  // Access powerPlans.plans directly as it's reactive from the underlying $state in powerplans.svelte.ts
  let localAvailablePowerPlans = $state<PowerPlan[]>(powerPlans.plans);

  function handlePowerPlanChange(
    event: Event & { currentTarget: HTMLSelectElement },
    targetSetting: "powerPlanCS2" | "powerPlanDefault"
  ) {
    const selectedGuid = event.currentTarget.value;
    // Accessing $state variable directly
    const selectedPlan = localAvailablePowerPlans.find(
      (plan) => plan.guid === selectedGuid
    );
    if (selectedPlan) {
      // Update the settings store directly
      settings[targetSetting] = {
        guid: selectedPlan.guid,
        name: selectedPlan.name,
      };
    }
  }

  function refreshAvailablePowerPlans() {
    // This function is called by the new refresh button.
    // It updates the local list of power plans with the current plans from the powerPlans store.
    localAvailablePowerPlans = powerPlans.plans; // Use powerPlans.plans directly
  }
</script>

<div class="power-plan-management-container">
  <h2>Power Plan Management</h2>

  <div class="setting-item toggle-setting">
    <Toggle
      label="Enable Power Plan Management"
      id="powerPlanManagementActive"
      name="powerPlanManagementActive"
      bind:checked={settings.powerPlanManagementActive}
    />
  </div>

  {#if settings.powerPlanManagementActive}
    <div class="refresh-section">
      <button
        type="button"
        class="button primary-button refresh-button"
        onclick={refreshAvailablePowerPlans}
        disabled={powerPlans.isLoading}
      >
        <Icon icon="solar:refresh-linear" width="20" height="20" />
        Refresh Available Power Plans
      </button>
      {#if powerPlans.isLoading && localAvailablePowerPlans.length === 0}
        <span class="loading-text info-text"> (Loading initial list...)</span>
      {:else if powerPlans.isLoading}
        <span class="loading-text info-text">
          (Refreshing in background...)</span
        >
      {/if}
    </div>

    <form onsubmit={(e) => e.preventDefault()} class="power-plan-form">
      <div class="form-group">
        <label for="powerPlanCS2">Power Plan for CS2:</label>
        <select
          id="powerPlanCS2"
          name="powerPlanCS2"
          value={settings.powerPlanCS2?.guid}
          onchange={(e) => handlePowerPlanChange(e, "powerPlanCS2")}
          disabled={powerPlans.isLoading || !!powerPlans.error}
          class="styled-select"
        >
          {#if powerPlans.error}
            <option value="" disabled selected>Error: {powerPlans.error}</option
            >
          {:else if localAvailablePowerPlans.length === 0}
            {#if powerPlans.isLoading}
              <option value="" disabled selected>Loading power plans...</option>
            {:else}
              <option value="" disabled selected
                >No power plans found. (Try Refresh)</option
              >
            {/if}
          {:else}
            <option value="" disabled selected>
              {settings.powerPlanCS2?.name
                ? `Current: ${settings.powerPlanCS2.name}`
                : "Select a power plan for CS2"}
            </option>
            {#each localAvailablePowerPlans as plan (plan.guid)}
              <option value={plan.guid}>{plan.name}</option>
            {/each}
          {/if}
        </select>
      </div>

      <div class="form-group">
        <label for="powerPlanDefault"
          >Default Power Plan (when CS2 is not running):</label
        >
        <select
          id="powerPlanDefault"
          name="powerPlanDefault"
          value={settings.powerPlanDefault?.guid}
          onchange={(e) => handlePowerPlanChange(e, "powerPlanDefault")}
          disabled={powerPlans.isLoading || !!powerPlans.error}
          class="styled-select"
        >
          {#if powerPlans.error}
            <option value="" disabled selected>Error: {powerPlans.error}</option
            >
          {:else if localAvailablePowerPlans.length === 0}
            {#if powerPlans.isLoading}
              <option value="" disabled selected>Loading power plans...</option>
            {:else}
              <option value="" disabled selected
                >No power plans found. (Try Refresh)</option
              >
            {/if}
          {:else}
            <option value="" disabled selected>
              {settings.powerPlanDefault?.name
                ? `Current: ${settings.powerPlanDefault.name}`
                : "Select a default power plan"}
            </option>
            {#each localAvailablePowerPlans as plan (plan.guid)}
              <option value={plan.guid}>{plan.name}</option>
            {/each}
          {/if}
        </select>
      </div>
    </form>

    <div class="current-settings-view card-style">
      <h3>Current Power Plan Settings</h3>
      <p>
        <strong>CS2 Power Plan:</strong>
        {settings.powerPlanCS2?.name || "Not set"}
        {#if settings.powerPlanCS2?.guid}
          <span class="guid-text">({settings.powerPlanCS2.guid})</span>
        {/if}
      </p>
      <p>
        <strong>Default Power Plan:</strong>
        {settings.powerPlanDefault?.name || "Not set"}
        {#if settings.powerPlanDefault?.guid}
          <span class="guid-text">({settings.powerPlanDefault.guid})</span>
        {/if}
      </p>
    </div>
  {/if}
</div>

<style scoped>
  .power-plan-management-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .setting-item {
    background-color: var(--background-secondary);
    padding: 15px;
    border-radius: var(--window-corner-radius);
  }

  .refresh-section {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-top: 10px;
    margin-bottom: 10px;
  }

  .button.refresh-button {
    /* Assuming Button.svelte or global button styles will cover this */
    /* Specific overrides if needed */
    display: inline-flex; /* Align icon and text */
    align-items: center;
    gap: 8px;
  }

  .loading-text {
    color: var(--text-secondary);
  }

  .power-plan-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
    background-color: var(--background-secondary);
    padding: 20px;
    border-radius: var(--window-corner-radius);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  label {
    font-weight: 500; /* Inter Medium */
    color: var(--text-primary);
    font-size: 14px; /* Labels & Captions */
  }

  .styled-select {
    width: 100%;
    padding: 10px;
    background-color: var(--background-primary);
    color: var(--text-primary);
    border: 1px solid var(--text-secondary);
    border-radius: 4px;
    font-size: 16px;
  }

  .styled-select:disabled {
    background-color: var(--background-secondary);
    color: var(--text-secondary);
    cursor: not-allowed;
  }

  .current-settings-view {
    margin-top: 15px;
    padding: 15px;
    background-color: var(--background-secondary);
    border-radius: var(--window-corner-radius);
  }

  .current-settings-view h3 {
    color: var(--primary-accent);
    margin-bottom: 10px;
    font-size: 18px; /* H3 Card/Item Title */
  }

  .current-settings-view p {
    margin-bottom: 8px;
    font-size: 16px;
  }

  .guid-text {
    font-size: 14px;
    color: var(--text-secondary);
    margin-left: 5px;
  }

  .info-text {
    color: var(--text-secondary);
    font-style: italic;
  }
</style>
