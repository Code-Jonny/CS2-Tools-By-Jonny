import { settings } from "@lib/settingsStore.svelte.ts";
import { filesystem, os, window as neuWindow } from "@neutralinojs/lib";
import { devWarn, devError } from "@lib/logger.ts"; // Import the logger

const REGISTRY_PATH = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run";

/**
 * Gets the registry key name for the application, preferring window.NL_APPID.
 * Falls back to applicationId from neutralino.config.json, then a default.
 */
async function getAppRegistryKeyName(): Promise<string> {
  if (typeof NL_APPID === "string" && NL_APPID) {
    return NL_APPID;
  }
  try {
    const configContent = await filesystem.readFile("./neutralino.config.json");
    const config = JSON.parse(configContent);
    if (config.applicationId) {
      return config.applicationId;
    }
    devWarn(
      "applicationId not found in neutralino.config.json. Using a default key name for registry: MyNeutralinoAppCS2Tools"
    );
  } catch (error) {
    devError("Error reading applicationId from neutralino.config.json:", error);
  }
  return "MyNeutralinoAppCS2Tools"; // Last resort fallback
}

/**
 * Gets the full path to the application executable.
 * Prefers window.NL_PATH if available.
 * Falls back to constructing path from NL_CWD, /bin/, and binaryName from config.
 */
async function getApplicationExecutablePath(): Promise<string> {
  // Check if NL_PATH is a string, not empty, and not just "."
  if (typeof NL_PATH === "string" && NL_PATH && NL_PATH !== ".") {
    // Basic check: Does it end with .exe on Windows?
    if (NL_OS === "Windows" && !NL_PATH.toLowerCase().endsWith(".exe")) {
      devWarn(
        `[startupUtils.ts] getApplicationExecutablePath: NL_PATH ("${NL_PATH}") on Windows does not end with .exe. This might be incorrect for autostart, but using it as provided by the environment.`
      );
    }
    return NL_PATH;
  }

  // If NL_PATH was undefined, empty, or exactly ".", then use fallback.
  const nlPathValueForLog =
    typeof NL_PATH === "undefined" ? "undefined" : `"${NL_PATH}"`;
  devWarn(
    `[startupUtils.ts] getApplicationExecutablePath: NL_PATH is ${nlPathValueForLog}. This is not a suitable executable path (e.g. if ".", or if app is run via "neu run") or it's not defined. Attempting fallback strategy...`
  );
  try {
    const cwd = await os.getEnv("NL_CWD");
    let binaryName = "neutralino-win_x64"; // Default based on common patterns

    try {
      const configFileContent = await filesystem.readFile(
        "./neutralino.config.json"
      );
      const config = JSON.parse(configFileContent);
      if (config && config.cli && config.cli.binaryName) {
        binaryName = config.cli.binaryName;
      } else {
        devWarn(
          `cli.binaryName not found in neutralino.config.json, using default: ${binaryName}`
        );
      }
    } catch (e) {
      devWarn(
        `Could not read binaryName from neutralino.config.json, using default: ${binaryName}. Error: ${e}`
      );
    }

    let constructedPath: string;
    if (NL_OS === "Windows") {
      // Corrected fallback: NL_CWD is project root, binary is in /bin/
      constructedPath = `${NL_CWD}\\\\bin\\\\${binaryName}.exe`;
    } else {
      // For Linux/macOS, adjust as needed if binaries are in /bin/
      constructedPath = `${NL_CWD}/bin/${binaryName}`;
    }
    return constructedPath;
  } catch (error) {
    devError(
      "[startupUtils.ts] getApplicationExecutablePath: Error constructing app executable path using fallback:",
      error
    );
    throw new Error("Could not determine application executable path.");
  }
}

/**
 * Enables or disables autostart for the application on Windows.
 * @param enable True to enable autostart, false to disable.
 */
export async function setAutostart(enable: boolean): Promise<void> {
  if (NL_OS !== "Windows") {
    devWarn(
      "[startupUtils.ts] setAutostart: Autostart modification is only supported on Windows. Aborting."
    );
    return;
  }
  try {
    const appKeyName = await getAppRegistryKeyName();
    const appExecPath = await getApplicationExecutablePath();

    const quotedAppExecPath = appExecPath.includes(" ")
      ? `\"${appExecPath}\"`
      : appExecPath;

    let command: string;
    if (enable) {
      command = `reg add "${REGISTRY_PATH}" /v "${appKeyName}" /t REG_SZ /d "${quotedAppExecPath}" /f`;
    } else {
      command = `reg delete "${REGISTRY_PATH}" /v "${appKeyName}" /f`;
    }

    const result = await os.execCommand(command);
    if (result.stdErr && result.stdErr.toLowerCase().includes("error")) {
      devError(
        `[startupUtils.ts] setAutostart: Error reported from reg command: ${result.stdErr}`
      );
      // Potentially throw an error here if stdErr indicates failure,
      // especially for the 'add' command, as 'delete' might report an error if key doesn't exist (which is fine).
      if (enable) {
        throw new Error(`Registry command failed: ${result.stdErr}`);
      }
    }
  } catch (error) {
    devError(
      `[startupUtils.ts] setAutostart: Error in setAutostart function (${
        enable ? "enabling" : "disabling"
      }):`,
      error
    );
    throw error; // Re-throw for the caller (e.g., Settings.svelte) to handle UI notifications
  }
}

/**
 * Checks if autostart is currently enabled for the application on Windows.
 * @returns True if autostart is enabled, false otherwise.
 */
export async function checkAutostartStatus(): Promise<boolean> {
  if (NL_OS !== "Windows") {
    devWarn(
      "[startupUtils.ts] checkAutostartStatus: Autostart status check is only supported on Windows. Returning false."
    );
    return false;
  }
  let appKeyName = "";
  try {
    appKeyName = await getAppRegistryKeyName();
    const command = `reg query "${REGISTRY_PATH}" /v "${appKeyName}"`;
    const result = await os.execCommand(command);

    // More robust check: Ensure stdOut contains the appKeyName and is not empty.
    // A successful query for an existing value will typically list the value name, type, and data.
    // If the key/value doesn't exist, reg query usually outputs to stdErr and os.execCommand should throw.
    // However, if it's not throwing and stdErr is empty, we need to be more careful.
    if (result.stdOut && result.stdOut.includes(appKeyName)) {
      return true;
    } else {
      return false;
    }
  } catch (error: any) {
    // This error is expected if the key is not found, so no devError here.
    return false;
  }
}

/**
 * Applies the "start minimized" setting.
 * Should be called at application startup after Neutralino is ready.
 */
export async function applyStartMinimizedSetting(): Promise<void> {
  if (settings.startMinimized) {
    try {
      await neuWindow.minimize();
    } catch (error) {
      devError(
        "[startupUtils.ts] applyStartMinimizedSetting: Error minimizing window on startup:",
        error
      );
    }
  }
}
