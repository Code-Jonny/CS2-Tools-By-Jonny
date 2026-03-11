/**
 * @file logger.ts
 * @description A simple logger utility that only logs messages in development mode.
 */
import { settings } from "@lib/settingsStore";

/**
 * Logs a message to the console only in development mode.
 * @param {...any} args - The arguments to log.
 */
export function logInfo(...args: any[]): void {
  if (import.meta.env.DEV || settings.enableDebugLog) {
    console.log(...args);
  }
}

/**
 * Logs a warning message to the console only in development mode.
 * @param {...any} args - The arguments to log.
 */
export function logWarn(...args: any[]): void {
  if (import.meta.env.DEV || settings.enableDebugLog) {
    console.warn(...args);
  }
}

/**
 * Logs an error message to the console only in development mode.
 * @param {...any} args - The arguments to log.
 */
export function logError(...args: any[]): void {
  if (import.meta.env.DEV || settings.enableDebugLog) {
    console.error(...args);
  }
}
