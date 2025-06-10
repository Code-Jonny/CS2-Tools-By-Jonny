<script lang="ts">
  // Import the reactive settings store and the reset function
  import { settings, resetToDefaults } from "@lib/settingsStore.svelte.ts";
  import { getPowerPlans, type PowerPlan } from "@lib/powerplan";
  import { onMount } from "svelte";

  let availablePowerPlans: PowerPlan[] = $state([]);

  onMount(async () => {
    availablePowerPlans = await getPowerPlans();
  });

  async function handleResetToDefaults() {
    if (
      confirm("Are you sure you want to reset all settings to their defaults?")
    ) {
      try {
        await resetToDefaults();
        alert("Settings have been reset to defaults.");
      } catch (error) {
        console.error("Error resetting settings:", error);
        alert("Failed to reset settings.");
      }
    }
  }

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
  <h2>Settings</h2>
  <form onsubmit={(e) => e.preventDefault()}>
    <label for="storeSetting1">Setting 1 (Store)</label>
    <input
      type="text"
      id="storeSetting1"
      name="storeSetting1"
      bind:value={settings.setting1}
    />
    <label for="storeSetting2">Setting 2 (Store)</label>
    <input
      type="text"
      id="storeSetting2"
      name="storeSetting2"
      bind:value={settings.setting2}
    />

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

    <button type="submit">Save (Auto)</button>
    <button type="button" onclick={handleResetToDefaults}>
      Reset to Defaults
    </button>

    {#if settings.processesToKill && settings.processesToKill.length > 0}
      <div style="margin-top: 1rem;">
        <h4>Processes to Kill:</h4>
        <ul>
          {#each settings.processesToKill as processName, index ("process-to-kill-" + index)}
            <li>
              {processName}
              <button
                type="button"
                onclick={() => {
                  settings.processesToKill = settings.processesToKill.filter(
                    (_: string, i: number) => i !== index
                  );
                }}
                style="margin-left: 8px;"
              >
                Remove
              </button>
            </li>
          {/each}
        </ul>
      </div>
    {:else}
      <p style="margin-top: 1rem;">No processes configured to be killed.</p>
    {/if}
  </form>

  <hr />
  <h3>Current Settings (Live View from Store)</h3>
  <p>Setting 1: {settings.setting1}</p>
  <p>Setting 2: {settings.setting2}</p>
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
  input {
    width: 100%;
    padding: 8px;
    margin-top: 5px;
    margin-bottom: 10px;
    box-sizing: border-box;
  }
  button {
    margin-right: 10px;
    padding: 10px 15px;
  }
</style>
