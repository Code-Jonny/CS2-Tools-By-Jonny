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
 * Prefers window.NL_PATH if available (typically for bundled apps).
 * Falls back to constructing path from NL_CWD, /bin/, and binaryName from config (typically for dev mode).
 * Ensures paths use backslashes on Windows.
 */
async function getApplicationExecutablePath(): Promise<string> {
  const normalizePathForWindows = (pathStr: string): string => {
    if (NL_OS === "Windows") {
      return pathStr.replace(/\//g, "\\");
    }
    return pathStr;
  };

  // Scenario 1: NL_PATH is defined, not empty, not "." (typically bundled app)
  if (typeof NL_PATH === "string" && NL_PATH && NL_PATH !== ".") {
    const originalNLPath = NL_PATH; // Keep original for logging if needed

    if (NL_OS === "Windows") {
      const normalizedBasePath = normalizePathForWindows(originalNLPath);
      if (normalizedBasePath.toLowerCase().endsWith(".exe")) {
        return normalizedBasePath;
      } else {
        devWarn(
          `[startupUtils.ts] getApplicationExecutablePath: NL_PATH ("${originalNLPath}") on Windows does not end with .exe. Appending platform suffix and extension.`
        );
        const archSuffix =
          typeof NL_ARCH === "string" && NL_ARCH ? `_${NL_ARCH}` : "_x64"; // Default to x64 if NL_ARCH is not set, common for Windows
        return `${normalizedBasePath}-win${archSuffix}.exe`;
      }
    } else if (NL_OS === "Linux" || NL_OS === "Darwin") {
      // Non-Windows: NL_PATH is used as is or with suffixes. Forward slashes are standard.
      const platformSuffixPattern = new RegExp(
        `-(linux|mac)_(${NL_ARCH || "\\\\w+"})$`
      );
      if (
        !platformSuffixPattern.test(originalNLPath) &&
        originalNLPath.lastIndexOf("/") > originalNLPath.lastIndexOf(".")
      ) {
        devWarn(
          `[startupUtils.ts] getApplicationExecutablePath: NL_PATH ("${originalNLPath}") on ${NL_OS} does not appear to be a full executable name. Appending platform suffix.`
        );
        const archSuffix =
          typeof NL_ARCH === "string" && NL_ARCH ? `_${NL_ARCH}` : "";
        const osSuffix = NL_OS === "Linux" ? "linux" : "mac";
        return `${originalNLPath}-${osSuffix}${archSuffix}`;
      }
      // Otherwise, assume NL_PATH is correct for non-Windows bundled apps.
      return originalNLPath;
    }
    // For other OSes or if logic above doesn't apply, return NL_PATH.
    // Normalize if Windows, otherwise return as is.
    return normalizePathForWindows(originalNLPath);
  }

  // Scenario 2: Fallback (NL_PATH is undefined, empty, or ".", typically "neu run" or dev mode)
  const nlPathValueForLog =
    typeof NL_PATH === "undefined" ? "undefined" : `"${NL_PATH}"`;
  devWarn(
    `[startupUtils.ts] getApplicationExecutablePath: NL_PATH is ${nlPathValueForLog}. Attempting fallback strategy (likely dev mode).`
  );

  try {
    const cwd = NL_CWD; // NL_CWD might contain / or \\
    let baseBinaryName = "";

    try {
      const configFileContent = await filesystem.readFile(
        "./neutralino.config.json"
      );
      const config = JSON.parse(configFileContent);
      if (config && config.cli && config.cli.binaryName) {
        baseBinaryName = config.cli.binaryName;
      } else {
        devWarn(
          "[startupUtils.ts] cli.binaryName not found in neutralino.config.json. Attempting to use applicationId as fallback for base binary name."
        );
        if (config && config.applicationId) {
          const parts = config.applicationId.split(".");
          baseBinaryName = parts[parts.length - 1];
          if (!baseBinaryName) {
            throw new Error(
              "applicationId is empty or invalid for deriving a base binary name."
            );
          }
          devWarn(
            `[startupUtils.ts] Using derived base binary name from applicationId: "${baseBinaryName}"`
          );
        } else {
          throw new Error(
            "cli.binaryName and applicationId are missing in neutralino.config.json. Cannot determine binary name."
          );
        }
      }
    } catch (e: any) {
      devError(
        `[startupUtils.ts] Could not read baseBinaryName from neutralino.config.json. Error: ${
          e.message || e
        }`
      );
      throw new Error(
        `Failed to read/parse neutralino.config.json for binary name: ${
          e.message || e
        }`
      );
    }

    if (!baseBinaryName) {
      throw new Error("Base binary name could not be determined.");
    }

    let fullBinaryNameWithSuffix: string;
    const archSuffix =
      typeof NL_ARCH === "string" && NL_ARCH
        ? `_${NL_ARCH}`
        : NL_OS === "Windows"
        ? "_x64"
        : ""; // Default arch for Windows if not set

    if (NL_OS === "Windows") {
      fullBinaryNameWithSuffix = `${baseBinaryName}-win${archSuffix}.exe`;
    } else if (NL_OS === "Linux") {
      fullBinaryNameWithSuffix = `${baseBinaryName}-linux${archSuffix}`;
    } else if (NL_OS === "Darwin") {
      fullBinaryNameWithSuffix = `${baseBinaryName}-mac${archSuffix}`;
    } else {
      devError(
        `[startupUtils.ts] Unsupported OS for fallback path construction: ${NL_OS}`
      );
      throw new Error(`Unsupported OS for fallback path: ${NL_OS}`);
    }

    let constructedPath: string;
    if (NL_OS === "Windows") {
      const normalizedCwd = normalizePathForWindows(cwd);
      constructedPath = `${normalizedCwd}\\bin\\${fullBinaryNameWithSuffix}`;
    } else {
      // For Linux/Darwin, use original cwd (which uses /) and / as separator
      constructedPath = `${cwd}/bin/${fullBinaryNameWithSuffix}`;
    }
    devWarn(
      `[startupUtils.ts] Constructed fallback executable path: ${constructedPath}`
    );
    return constructedPath;
  } catch (error: any) {
    devError(
      `[startupUtils.ts] getApplicationExecutablePath: Error constructing app executable path using fallback: ${
        error.message || error
      }`
    );
    throw new Error(
      `Could not determine application executable path via fallback: ${
        error.message || error
      }`
    );
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
