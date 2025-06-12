import Neutralino from "@neutralinojs/lib";

import { mount } from "svelte";
import "./app.css";
import App from "./App.svelte";
import { loadAndInitializeSettings } from "./lib/settingsStore.svelte.js";
import { applyStartMinimizedSetting } from "./lib/startupUtils";

const app = mount(App, {
  target: document.getElementById("app")!,
});

async function main() {
  Neutralino.init();

  // Prevent right-click context menu
  document.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });

  let tray = {
    icon: "/app/icon.png",
    menuItems: [
      { id: "open", text: "Open" },
      { text: "-" },
      { id: "quit", text: "Quit" },
    ],
  };

  await Neutralino.os.setTray(tray);

  const startMinimized = await Neutralino.storage.getData("startMinimized");

  if (startMinimized === "true") {
    await Neutralino.window.hide();
  }

  async function handleTrayEvent(event: any) {
    if (event.detail.id === "open") {
      await Neutralino.window.show();
      await Neutralino.window.unminimize();
    }
    if (event.detail.id === "quit") {
      Neutralino.app.exit();
    }
    // console.log("Tray menu item clicked:", event);
  }

  // Workaround to hide window on minimize
  setInterval(async () => {
    if (await Neutralino.window.isMinimized()) {
      Neutralino.window.hide();
    }
  }, 1000); // Check every second

  await Neutralino.events.on("trayMenuItemClicked", handleTrayEvent);
}

main();

export default app;
