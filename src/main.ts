import { mount } from "svelte";
import "./app.css";
import App from "./App.svelte";

/**
 * Mounts the main Svelte application to the DOM.
 * This is the entry point for the UI rendering.
 */
const app = mount(App, {
  target: document.getElementById("app")!,
});

export default app;
