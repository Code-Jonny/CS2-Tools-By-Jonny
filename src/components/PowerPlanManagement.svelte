<script lang="ts">
  import { settings } from "@lib/settingsStore.svelte.ts";
  import { powerPlans, type PowerPlan } from "@lib/powerplans.svelte.ts";
  import Toggle from "@elements/Toggle.svelte"; // Added import for Toggle component

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

<div class="container">
  <h2>Power Plan Management</h2>

  <Toggle
    label="Enable Power Plan Management"
    id="powerPlanManagementActive"
    name="powerPlanManagementActive"
    checked={settings.powerPlanManagementActive}
    checkedChanged={(newVal) => (settings.powerPlanManagementActive = newVal)}
  />

  {#if settings.powerPlanManagementActive}
    <div style="margin-bottom: 10px; margin-top: 10px;">
      <button
        type="button"
        onclick={refreshAvailablePowerPlans}
        disabled={powerPlans.isLoading}
      >
        Refresh Available Power Plans
      </button>
      {#if powerPlans.isLoading && localAvailablePowerPlans.length === 0}
        <!-- Removed $ from powerPlans -->
        <span> (Loading initial list...)</span>
      {:else if powerPlans.isLoading}
        <!-- Removed $ from powerPlans -->
        <span> (Refreshing in background...)</span>
      {/if}
    </div>

    <form onsubmit={(e) => e.preventDefault()}>
      <label for="powerPlanCS2">Power Plan for CS2</label>
      <select
        id="powerPlanCS2"
        name="powerPlanCS2"
        value={settings.powerPlanCS2?.guid}
        onchange={(e) => handlePowerPlanChange(e, "powerPlanCS2")}
        disabled={powerPlans.isLoading || !!powerPlans.error}
      >
        {#if powerPlans.error}
          <!-- Removed $ from powerPlans -->
          <option value="" disabled selected>Error: {powerPlans.error}</option>
          <!-- Removed $ from powerPlans -->
        {:else if localAvailablePowerPlans.length === 0}
          {#if powerPlans.isLoading}
            <!-- Removed $ from powerPlans -->
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
              : "Select a power plan"}
          </option>
          {#each localAvailablePowerPlans as plan (plan.guid)}
            <option value={plan.guid}>{plan.name}</option>
          {/each}
        {/if}
      </select>

      <label for="powerPlanDefault">Default Power Plan</label>
      <select
        id="powerPlanDefault"
        name="powerPlanDefault"
        value={settings.powerPlanDefault?.guid}
        onchange={(e) => handlePowerPlanChange(e, "powerPlanDefault")}
        disabled={powerPlans.isLoading || !!powerPlans.error}
      >
        {#if powerPlans.error}
          <!-- Removed $ from powerPlans -->
          <option value="" disabled selected>Error: {powerPlans.error}</option>
          <!-- Removed $ from powerPlans -->
        {:else if localAvailablePowerPlans.length === 0}
          {#if powerPlans.isLoading}
            <!-- Removed $ from powerPlans -->
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
              : "Select a power plan"}
          </option>
          {#each localAvailablePowerPlans as plan (plan.guid)}
            <option value={plan.guid}>{plan.name}</option>
          {/each}
        {/if}
      </select>

      <!-- Removed Save button as settings are auto-saved by the store -->
      <!-- <button type="submit">Save (Auto)</button> -->
    </form>

    <hr />
    <h3>Current Power Plan Settings (Live View from Store)</h3>
    <p>
      CS2 Power Plan: {settings.powerPlanCS2?.name} ({settings.powerPlanCS2
        ?.guid})
    </p>
    <p>
      Default Power Plan: {settings.powerPlanDefault?.name} ({settings
        .powerPlanDefault?.guid})
    </p>
  {/if}
</div>

<style scoped>
  hr {
    margin-top: 20px;
    margin-bottom: 20px;
  }
  .container {
    /* Add any specific styles for this component if needed */
  }
  label {
    display: block;
    margin-top: 10px;
  }
  select {
    /* Combined styles for select and checkbox */
    width: auto; /* Let the browser decide or set a specific width if needed */
    padding: 8px;
    margin-top: 5px;
    margin-bottom: 10px;
    box-sizing: border-box;
  }
</style>
