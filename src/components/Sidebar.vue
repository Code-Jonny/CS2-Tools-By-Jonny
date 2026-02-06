<script setup lang="ts">
  import { currentView } from "@lib/viewStore";
  import { isSidebarExpanded, expandSidebar, collapseSidebar } from "@lib/sidebarStore";
  import LocalIcon from "@icons/Icon.vue";
  import { Icon as IconifyIcon } from "@iconify/vue";
</script>

<template>
  <nav :class="{ expanded: isSidebarExpanded }" @mouseenter="expandSidebar"
       @mouseleave="collapseSidebar">
    <img src="/logo.png" alt="CS2Tools Logo" class="logo" />
    <ul>
      <li>
        <a href="#/" :class="{ active: currentView === 'dashboard' }">
          <LocalIcon iconName="home" />
          <span v-if="isSidebarExpanded">Dashboard</span>
        </a>
      </li>
      <li>
        <a href="#/process-management"
           :class="{ active: currentView === 'process-management' }">
          <LocalIcon iconName="tasks" />
          <span v-if="isSidebarExpanded">Process Management</span>
        </a>
      </li>
      <li>
        <a href="#/power-plan-management"
           :class="{ active: currentView === 'power-plan-management' }">
          <LocalIcon iconName="power" />
          <span v-if="isSidebarExpanded">Power Plan Management</span>
        </a>
      </li>
      <li>
        <a href="#/cpu-affinity"
           :class="{ active: currentView === 'cpu-affinity' }">
          <IconifyIcon icon="solar:cpu-linear" width="24" height="24" />
          <span v-if="isSidebarExpanded">CPU Core Affinity</span>
        </a>
      </li>
      <li>
        <a href="#/nvidia-vibrance"
           :class="{ active: currentView === 'nvidia-vibrance' }">
          <IconifyIcon icon="solar:monitor-camera-linear" width="24"
                       height="24" />
          <span v-if="isSidebarExpanded">Nvidia Vibrance</span>
        </a>
      </li>
      <li>
        <a href="#/settings" :class="{ active: currentView === 'settings' }">
          <LocalIcon iconName="settings" />
          <span v-if="isSidebarExpanded">Settings</span>
        </a>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
  nav {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 60px;
    /* Collapsed width */
    background-color: black;
    padding-top: 20px;
    padding-inline: 6px;
    border-right: 1px solid var(--background-primary);
    transition: width 0.15s ease-in-out;
    overflow-x: hidden;
    /* Hide text when collapsed */
    z-index: 100;
    /* Ensure sidebar stays on top */
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 40px;
  }

  nav.expanded {
    width: 270px;
    /* Expanded width */
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  li {
    width: 100%;
    /* Center logo */
    display: flex;
    justify-content: center;
    /* Horizontally center content in collapsed state */
  }

  /* Logo styling */
  .logo {
    display: block;
    width: 46px;
    height: auto;
    justify-self: flex-start;

    nav.expanded & {
      width: 80px;
      margin-bottom:
    }
  }

  nav.expanded li {
    justify-content: flex-start;
    /* Align left when expanded */
    /* padding-left: 20px; */
  }

  a {
    display: flex;
    align-items: center;
    text-decoration: none;
    color: var(--text-secondary);
    width: 100%;
    /* Fill li width */
    padding: 12px;
    border-radius: 8px;
    /* Soft corners for hover effect */
    transition: background-color 0.2s, color 0.2s;
    gap: 15px;
    /* Space between icon and text */
    white-space: nowrap;
    /* Prevent text wrapping */
  }

  /* Centered icons when collapsed */
  nav:not(.expanded) a {
    justify-content: center;
    padding: 12px 0;
    /* Remove side padding to center properly */
  }

  nav.expanded a {
    padding: 12px 15px;
    /* Restore padding */
    justify-content: flex-start;
  }

  a:hover {
    background-color: var(--background-secondary, #242424);
    color: var(--text-primary);
  }

  a.active {
    background-color: var(--background-secondary, #242424);
    color: var(--primary-accent);
    font-weight: 500;
  }

  /* Icon coloring for active state */
  /* Target both SVG types */
  a.active :deep(svg) {
    /* color: var(--primary-accent) !important; */
    fill: var(--primary-accent);
    /* For filled icons */
    /* color: var(--primary-accent); */
  }

  /* Make sure stroke-based icons also get colored if you use them */
  /*
  a.active :deep(path) {
      stroke: var(--primary-accent);
  }
  */

  span {
    font-size: 16px;
    /* fade in text */
    animation: fadeIn 0.2s ease-in;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }

    to {
      opacity: 1;
    }
  }
</style>
