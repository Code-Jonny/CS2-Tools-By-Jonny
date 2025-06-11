import { writable } from "svelte/store";

export const isSidebarExpanded = writable(false);

export function expandSidebar() {
  isSidebarExpanded.set(true);
}

export function collapseSidebar() {
  isSidebarExpanded.set(false);
}
