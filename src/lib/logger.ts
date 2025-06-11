/**
 * A simple logger utility that only logs messages in development mode.
 * NeutralinoJS sets NL_MODE to "window" during `neu run` (development)
 * and to "chrome" during `neu run --frontend-lib-dev`.
 * In production builds (e.g., bundled apps), NL_MODE is typically "browser" or "cloud".
 */

const DEV_MODES = ["window", "chrome"];

/**
 * Logs a message to the console only in development mode.
 * @param {...any} args - The arguments to log.
 */
export function devLog(...args: any[]): void {
  if (DEV_MODES.includes(window.NL_MODE)) {
    console.log(...args);
  }
}

/**
 * Logs a warning message to the console only in development mode.
 * @param {...any} args - The arguments to log.
 */
export function devWarn(...args: any[]): void {
  if (DEV_MODES.includes(window.NL_MODE)) {
    console.warn(...args);
  }
}

/**
 * Logs an error message to the console only in development mode.
 * @param {...any} args - The arguments to log.
 */
export function devError(...args: any[]): void {
  if (DEV_MODES.includes(window.NL_MODE)) {
    console.error(...args);
  }
}
