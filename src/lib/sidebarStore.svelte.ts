/**
 * @file sidebarStore.svelte.ts
 * @description Manages the state of the sidebar (expanded/collapsed).
 * Uses a Svelte writable store to allow components to react to sidebar state changes.
 */

import { writable } from "svelte/store";

export const isSidebarExpanded = writable(false);

export function expandSidebar() {
  isSidebarExpanded.set(true);
}

export function collapseSidebar() {
  isSidebarExpanded.set(false);
}
