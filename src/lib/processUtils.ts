// c:\Programmieren\projects\cs2-tools\neutralino\src\lib\processUtils.ts

/**
 * A list of process names that should be protected from being added to the kill list.
 * These are typically essential system processes or the game itself.
 * The comparison is case-insensitive.
 */
export const PROTECTED_PROCESS_NAMES: string[] = [
  "[System Process]", // System Process
  "amdfendrsr.exe", // AMD External Events Utility
  "AmdPpkgSvc.exe", // AMD Power Profiling SDK Service
  "ApplicationFrameHost.exe", // Application Frame Host
  "atieclxx.exe", // AMD Driver
  "atiesrxx.exe", // AMD External Events Utility
  "audiodg.exe", // Audio Engine
  "cmd.exe", // Command Prompt
  "conhost.exe", // Console Window Host
  "csrss.exe", // Client/Server Runtime Subsystem
  "cs2.exe", // The game itself
  "cs2toolsbyjonny.exe", // The CS2 Tools application itself
  "ctfmon.exe", // Keyboard Input Loader
  "dasHost.exe", // Device Association Framework Host
  "DataExchangeHost.exe", // Data Exchange Host
  "dllhost.exe", // COM Surrogate
  "dwm.exe", // Desktop Window Manager
  "explorer.exe", // Windows Explorer
  "fontdrvhost.exe", // Font Driver Host
  "KillerAnalyticsService.exe", // Network Driver Utility
  "KillerNetworkService.exe", // Network Driver
  "lsass.exe", // Local Security Authority Process
  "LsaIso.exe", // LSA Isolated User Mode Process
  "Memory Compression", // Memory Compression Process
  "msedgewebview2.exe", // Microsoft Edge WebView2 (if used)
  "MpDefenderCoreService.exe", // Windows Defender
  "MsMpEng.exe", // Windows Defender
  "NisSrv.exe", // Network Inspection Service (Windows Defender)
  "NVDisplay.Container.exe", // NVIDIA Display Container LS
  "Registry", // Windows Registry
  "RtkAudUService64.exe", // Audio Driver
  "RuntimeBroker.exe", // Store App Permissions Manager
  "SearchFilterHost.exe", // Windows Search Filter Host
  "SearchHost.exe", // Windows Search Host
  "SearchIndexer.exe", // Windows Search
  "SearchProtocolHost.exe", // Windows Search Protocol Host
  "Secure System", // Secure System Process
  "SecurityHealthService.exe", // Windows Security Health Service
  "SecurityHealthSystray.exe", // Windows Security Health Systray
  "services.exe", // Services Control Manager
  "ShellExperienceHost.exe", // Shell Experience Host
  "ShellHost.exe", // Windows Shell Host
  "sihost.exe", // Shell Infrastructure
  "smss.exe", // Session Manager Subsystem
  "spoolsv.exe", // Print Spooler Service
  "StartMenuExperienceHost.exe", // Start Menu Experience Host
  "steam.exe", // Steam Client (if the user has it installed and running)
  "steamservice.exe", // Steam Client Service
  "steamwebhelper.exe", // Steam Web Helper
  "System", // Another name for the System Process
  "SystemSettings.exe", // System Settings
  "System Idle Process", // System Idle Process
  "svchost.exe", // Service Host Process
  "taskhostw.exe", // Task Host for Windows
  "taskmgr.exe", // Task Manager
  "TextInputHost.exe",
  "wininit.exe", // Windows Start-Up Application
  "winlogon.exe", // Windows Logon Application
  "wlanext.exe", // WiFi Driver
  "WmiPrvSE.exe", // Windows Management Instrumentation
  "wslservice.exe", // Subsystem for Linux (System Service)
  "WUDFHost.exe", // Windows Driver Foundation
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
    (protectedName) => protectedName.toLowerCase() === lowerCaseProcessName,
  );
}
