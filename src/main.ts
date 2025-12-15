import Neutralino from "@neutralinojs/lib";

import { mount } from "svelte";
import "./app.css";
import App from "./App.svelte";
import { loadAndInitializeSettings } from "./lib/settingsStore.svelte.js";
import { applyStartMinimizedSetting } from "./lib/startupUtils";

/**
 * Mounts the main Svelte application to the DOM.
 * This is the entry point for the UI rendering.
 */
const app = mount(App, {
  target: document.getElementById("app")!,
});

/**
 * Main initialization function for the Neutralino application.
 * Handles backend initialization, tray setup, and window management.
 */
async function main() {
  // Initialize the Neutralino backend
  Neutralino.init();

  // Prevent right-click context menu in production builds to behave more like a native app
  if (NL_MODE !== "window") {
    document.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });
  }

  // Define the system tray configuration
  let tray = {
    icon: "/app/icon.png",
    menuItems: [
      { id: "open", text: "Open" },
      { text: "-" },
      { id: "quit", text: "Quit" },
    ],
  };

  // Set up the system tray
  await Neutralino.os.setTray(tray);

  // Check if the app should start minimized from storage
  const startMinimized = await Neutralino.storage.getData("startMinimized");

  // If configured to start minimized, hide the window immediately
  if (startMinimized === "true") {
    await Neutralino.window.hide();
  }

  /**
   * Handles events triggered from the system tray menu.
   * @param {any} event - The tray event object.
   */
  async function handleTrayEvent(event: any) {
    if (event.detail.id === "open") {
      // Show and unminimize the window when "Open" is clicked
      await Neutralino.window.show();
      await Neutralino.window.unminimize();
    }
    if (event.detail.id === "quit") {
      // Exit the application when "Quit" is clicked
      Neutralino.app.exit();
    }
    // console.log("Tray menu item clicked:", event);
  }

  // Workaround to hide window on minimize
  // Neutralino doesn't always hide the window from the taskbar on minimize by default in some configs
  setInterval(async () => {
    if (await Neutralino.window.isMinimized()) {
      Neutralino.window.hide();
    }
  }, 1000); // Check every second

  // Register the tray event listener
  await Neutralino.events.on("trayMenuItemClicked", handleTrayEvent);
}

// Start the main initialization process
main();

export default app;
