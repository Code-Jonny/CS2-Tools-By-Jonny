/// <reference types="vite/client" />
/// <reference types="@testing-library/jest-dom" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare global {
  const NL_APPID: string;
  const NL_PORT: number;
  const NL_OS: string;
  const NL_ARCH: string;
  const NL_VERSION: string;
  const NL_COMMIT: string;
  const NL_CWD: string;
  const NL_ARGS: string[];
  const NL_MODE: string;
  const NL_PID: number;
  const NL_PATH: string;
}

export {};
