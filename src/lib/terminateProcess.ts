/**
 * @file terminateProcess.ts
 * @description Utility function to forcefully terminate a process by name.
 * It checks if the process is protected before attempting to kill it.
 */

import { os } from "@neutralinojs/lib";
import { isProcessProtected } from "@lib/processUtils"; // Added import

export async function terminateProcess(processName: string): Promise<void> {
  if (isProcessProtected(processName)) {
    console.warn(
      `Process "${processName}" is protected and cannot be terminated.`
    );
    return;
  }

  const command = `taskkill /F /IM ${processName}`;
  try {
    await os.execCommand(command);
    console.log(`Attempted to terminate process: ${processName}`);
  } catch (error) {
    console.error(`Failed to terminate process ${processName}:`, error);
    // Optionally, re-throw the error or handle it as needed
    // throw error;
  }
}
