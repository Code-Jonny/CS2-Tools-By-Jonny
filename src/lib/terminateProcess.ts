import { os } from "@neutralinojs/lib";

export async function terminateProcess(processName: string): Promise<void> {
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
