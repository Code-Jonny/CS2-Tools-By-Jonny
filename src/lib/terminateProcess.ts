/**
 * @file terminateProcess.ts
 * @description Utility function to forcefully terminate a process by PID.
 */

import { invoke } from "@tauri-apps/api/core";

export async function terminateProcess(pid: number): Promise<void> {
  try {
    await invoke("terminate_process", { pid });
    console.log(`Attempted to terminate process: ${pid}`);
  } catch (error) {
    console.error(`Failed to terminate process ${pid}:`, error);
    // throw error;
  }
}
