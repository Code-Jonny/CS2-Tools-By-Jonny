<script lang="ts">
  import { onMount } from "svelte";
  import { os } from "@neutralinojs/lib";
  import { terminateProcess } from "@lib/terminateProcess";
  // Import the reactive settings store and the reset function
  import { settings, resetToDefaults } from "@lib/settingsStore.svelte.ts";
  import {
    getPowerPlans,
    setActivePowerPlan,
    isPowerShellAvailable,
    canRunUnsignedScripts,
  } from "@lib/powerplan";

  import {
    runningProcesses,
    type ProcessInfo,
    type FilterType,
    type SortKey,
    type SortOrder,
  } from "@lib/runningProcesses.svelte.ts";

  import ProcessList from "@components/ProcessList.svelte";
  import test from "node:test";

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

  onMount(async () => {
    if (!(await isPowerShellAvailable())) {
      // Use Neutralino's dialogs to show a user-friendly error
      await os.showMessageBox(
        "PowerShell Not Found",
        "PowerShell is required for this feature but it could not be found on your system. Please ensure it is installed and available in your system's PATH.",
        "OK",
        "ERROR"
      );
      return; // Stop execution
    }

    if (!(await canRunUnsignedScripts())) {
      await os.showMessageBox(
        "PowerShell Security Policy",
        "Your system's PowerShell security policy is set to 'Restricted' or 'AllSigned', which prevents this application from running necessary scripts. Please see the application's documentation for information on how to adjust the policy.",
        "OK",
        "ERROR"
      );
      return; // Stop execution
    }

    // const command = "powercfg /list";
    // const output = await os.execCommand(command);
    // console.log("Power Plans Output:", output);
    let powerPlans = await getPowerPlans();

    // setInterval(async () => {
    // let date = new Date();
    // let time = date.toLocaleTimeString();
    // const command = 'tasklist | findstr /i "cs2.exe"';
    // const output = await os.execCommand(command);
    // runningProcesses.refresh();
    // const cs2Running = runningProcesses.isProcessRunning("cs2.exe");
    // console.log(time, cs2Running ? "CS2 is running." : "CS2 is not running.");
    // if (cs2Running) {
    //   // kill processes if they are running
    //   if (settings.processesToKill && settings.processesToKill.length > 0) {
    //     for (const processName of settings.processesToKill) {
    //       // use terminateProcess.ts module to kill the process
    //       await terminateProcess(processName);
    //     }
    //   }
    // }
    // console.log(time, "Polling for active processes...");
    // }, settings.pollingInterval || 5000);
  });
</script>

<main>
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
  </div>

  <div class="container">
    <ProcessList />
  </div>
</main>

<style scoped>
  hr {
    margin-top: 20px;
    margin-bottom: 20px;
  }
</style>
