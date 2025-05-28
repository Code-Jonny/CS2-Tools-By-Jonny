import Neutralino from "@neutralinojs/lib";

import { mount } from "svelte";
import "./app.css";
import App from "./App.svelte";
import "@picocss/pico/css/pico.yellow.min.css";

const app = mount(App, {
  target: document.getElementById("app")!,
});

Neutralino.init();

export default app;
