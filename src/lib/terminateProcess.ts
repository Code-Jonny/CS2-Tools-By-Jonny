/**
 * @file terminateProcess.ts
 * @description Utility function to forcefully terminate a process by PID.
 */

import { invoke } from "@tauri-apps/api/core";
import { logInfo, logError } from "@lib/logger";

export async function terminateProcess(pid: number): Promise<void> {
  try {
    await invoke("terminate_process", { pid });
    logInfo(`Attempted to terminate process: ${pid}`);
  } catch (error) {
    logError(`Failed to terminate process ${pid}:`, error);
    // throw error;
  }
}
