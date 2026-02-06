import { ref } from "vue";

export const isSidebarExpanded = ref(false);

export function expandSidebar() {
  isSidebarExpanded.value = true;
}

export function collapseSidebar() {
  isSidebarExpanded.value = false;
}
