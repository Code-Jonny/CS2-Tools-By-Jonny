import { storage } from "@neutralinojs/lib";

/**
 * Saves data to NeutralinoJS storage.
 * @param key The key under which to store the data.
 * @param value The data to store. Can be any serializable value.
 */
export async function saveData(key: string, value: any): Promise<void> {
  try {
    await storage.setData(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving data for key "${key}":`, error);
    // Potentially throw the error or handle it as per application needs
    throw error;
  }
}

/**
 * Retrieves data from NeutralinoJS storage.
 * @param key The key of the data to retrieve.
 * @param defaultValue Optional default value to return if the key is not found.
 * @returns The retrieved data, or the defaultValue if not found, or undefined if no defaultValue is provided.
 */
export async function getData<T>(
  key: string,
  defaultValue?: T
): Promise<T | undefined> {
  try {
    const rawValue = await storage.getData(key);
    return JSON.parse(rawValue) as T;
  } catch (error: any) {
    if (error.code === "NE_ST_NOSTKEX") {
      // Key not found
      if (defaultValue !== undefined) {
        // console.warn(`No data found for key "${key}", returning default value.`);
        return defaultValue;
      }
      // console.warn(`No data found for key "${key}" and no default value provided.`);
      return undefined;
    } else {
      console.error(`Error retrieving data for key "${key}":`, error);
      // Potentially throw the error or return a specific error state
      throw error;
    }
  }
}

/**
 * Checks if a key exists in NeutralinoJS storage.
 * @param key The key to check.
 * @returns True if the key exists, false otherwise.
 */
export async function exists(key: string): Promise<boolean> {
  try {
    await storage.getData(key);
    return true;
  } catch (error: any) {
    if (error.code === "NE_ST_NOSTKEX") {
      // Key not found
      return false;
    }
    // For other errors, it's uncertain if the key exists or not.
    // Depending on requirements, you might want to re-throw or log.
    console.error(`Error checking existence for key "${key}":`, error);
    return false; // Or throw error
  }
}
