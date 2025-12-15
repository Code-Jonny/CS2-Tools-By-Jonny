/**
 * @file logger.ts
 * @description A simple logger utility that only logs messages in development mode.
 */

/**
 * Logs a message to the console only in development mode.
 * @param {...any} args - The arguments to log.
 */
export function devLog(...args: any[]): void {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
}

/**
 * Logs a warning message to the console only in development mode.
 * @param {...any} args - The arguments to log.
 */
export function devWarn(...args: any[]): void {
  if (import.meta.env.DEV) {
    console.warn(...args);
  }
}

/**
 * Logs an error message to the console only in development mode.
 * @param {...any} args - The arguments to log.
 */
export function devError(...args: any[]): void {
  if (import.meta.env.DEV) {
    console.error(...args);
  }
}
