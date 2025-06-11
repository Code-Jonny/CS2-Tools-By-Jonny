// c:\Programmieren\projects\cs2-tools\neutralino\src\lib\processUtils.ts

/**
 * A list of process names that should be protected from being added to the kill list.
 * These are typically essential system processes or the game itself.
 * The comparison is case-insensitive.
 */
export const PROTECTED_PROCESS_NAMES: string[] = [
  "cs2.exe", // The game itself
  "explorer.exe", // Windows Explorer
  "dwm.exe", // Desktop Window Manager
  "svchost.exe", // Service Host Process
  "conhost.exe", // Console Window Host
  "taskmgr.exe", // Task Manager
  "wininit.exe", // Windows Start-Up Application
  "winlogon.exe", // Windows Logon Application
  "lsass.exe", // Local Security Authority Process
  "services.exe", // Services Control Manager
  "neutralino-win_x64.exe", // Neutralino framework process
  "cs2tools.exe", // The CS2 Tools application itself
  "msedgewebview2.exe", // Microsoft Edge WebView2 (if used)
  "power_plans.exe", // Power plans management tool
  // Add any other critical process names here, e.g., specific anti-cheat software
];

/**
 * Checks if a given process name is protected.
 * The check is case-insensitive.
 * @param processName - The name of the process to check (e.g., "chrome.exe").
 * @returns True if the process is protected, false otherwise.
 */
export function isProcessProtected(processName: string): boolean {
  if (!processName) {
    return false;
  }
  const lowerCaseProcessName = processName.toLowerCase();
  return PROTECTED_PROCESS_NAMES.some(
    (protectedName) => protectedName.toLowerCase() === lowerCaseProcessName
  );
}
