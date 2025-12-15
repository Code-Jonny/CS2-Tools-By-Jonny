/// <reference types="svelte" />
/// <reference types="vite/client" />
/// <reference types="@testing-library/jest-dom" />

declare global {
  const NL_APPID: string;
  const NL_PORT: number;
  const NL_OS: string;
  const NL_ARCH: string;
  const NL_VERSION: string;
  const NL_CVERSION: string;
  const NL_MODE: string;
  const NL_PID: number;
  const NL_ARGS: string[];
  const NL_PATH: string;
  const NL_CWD: string;
  const NL_RSCPATH: string;
  const NL_EXTCLIENTS: string;
  const NL_TOKEN: string;
  // Add any other Neutralino global variables you use
}

// To make the file a module and avoid "Cannot compile namespaces when the '--isolatedModules' flag is provided." error
export {};
