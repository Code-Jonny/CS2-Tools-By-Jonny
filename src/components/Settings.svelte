<script lang="ts">
  // Import the reactive settings store and the reset function
  import { settings, resetToDefaults } from "@lib/settingsStore.svelte.ts";
  import { onMount } from "svelte";

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
</script>

<div class="container">
  <h2>General Settings</h2>
  <form onsubmit={(e) => e.preventDefault()}>
    <label for="autostartWithWindows">Autostart with Windows</label>
    <input
      type="checkbox"
      id="autostartWithWindows"
      name="autostartWithWindows"
      bind:checked={settings.autostartWithWindows}
    />

    <button type="button" onclick={handleResetToDefaults}>
      Reset to Defaults
    </button>
  </form>

  <hr />
  <h3>Current General Settings (Live View from Store)</h3>
  <p>Autostart with Windows: {settings.autostartWithWindows}</p>
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
