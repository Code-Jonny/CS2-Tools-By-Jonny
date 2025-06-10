<script lang="ts">
  import { settings } from "@lib/settingsStore.svelte.ts";
  import { getPowerPlans, type PowerPlan } from "@lib/powerplan";
  import { onMount } from "svelte";

  let availablePowerPlans: PowerPlan[] = $state([]);

  onMount(async () => {
    availablePowerPlans = await getPowerPlans();
  });

  function handlePowerPlanChange(
    event: Event & { currentTarget: HTMLSelectElement },
    targetSetting: "powerPlanCS2" | "powerPlanDefault"
  ) {
    const selectedGuid = event.currentTarget.value;
    const selectedPlan = availablePowerPlans.find(
      (plan) => plan.guid === selectedGuid
    );
    if (selectedPlan) {
      settings[targetSetting] = {
        guid: selectedPlan.guid,
        name: selectedPlan.name,
      };
    }
  }
</script>

<div class="container">
  <h2>Power Plan Management</h2>
  <form onsubmit={(e) => e.preventDefault()}>
    <label for="powerPlanCS2">Power Plan for CS2</label>
    <select
      id="powerPlanCS2"
      name="powerPlanCS2"
      value={settings.powerPlanCS2?.guid}
      onchange={(e) => handlePowerPlanChange(e, "powerPlanCS2")}
    >
      {#if availablePowerPlans.length === 0}
        <option value="" disabled selected>Loading power plans...</option>
      {:else}
        <option value="" disabled selected>
          {settings.powerPlanCS2?.name
            ? `Current: ${settings.powerPlanCS2.name}`
            : "Select a power plan"}
        </option>
        {#each availablePowerPlans as plan (plan.guid)}
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
    >
      {#if availablePowerPlans.length === 0}
        <option value="" disabled selected>Loading power plans...</option>
      {:else}
        <option value="" disabled selected>
          {settings.powerPlanDefault?.name
            ? `Current: ${settings.powerPlanDefault.name}`
            : "Select a power plan"}
        </option>
        {#each availablePowerPlans as plan (plan.guid)}
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
    width: 100%;
    padding: 8px;
    margin-top: 5px;
    margin-bottom: 10px;
    box-sizing: border-box;
  }
</style>
