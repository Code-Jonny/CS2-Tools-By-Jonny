import Neutralino from "@neutralinojs/lib";

import { mount } from "svelte";
import "./app.css";
import App from "./App.svelte";
import { loadAndInitializeSettings } from "./lib/settingsStore.svelte.js";
import { applyStartMinimizedSetting } from "./lib/startupUtils";
// import "@picocss/pico/css/pico.yellow.min.css";

const app = mount(App, {
  target: document.getElementById("app")!,
});

async function main() {
  Neutralino.init();

  // Wait for settings to be loaded
  await loadAndInitializeSettings();

  // Apply the start minimized setting
  await applyStartMinimizedSetting();
}

main();

export default app;
