<script lang="ts">
  import Icon from "@iconify/svelte";
  import { currentView } from "@lib/viewStore.svelte.ts";
  import {
    isSidebarExpanded,
    expandSidebar,
    collapseSidebar,
  } from "@lib/sidebarStore.svelte.ts";

  // Local state for isExpanded is removed, now using store
</script>

<nav
  class:expanded={$isSidebarExpanded}
  on:mouseenter={expandSidebar}
  on:mouseleave={collapseSidebar}
>
  <ul>
    <!-- {#if $isSidebarExpanded}
      <li class="sidebar-title">CS2Tools by Jonny</li>
    {/if} -->
    <li>
      <img src="/app/logo.png" alt="CS2Tools Logo" class="logo" />
    </li>
    <li>
      <a href="#/" class:active={$currentView === "dashboard"}>
        <Icon icon="solar:home-smile-linear" width="24" height="24" />
        {#if $isSidebarExpanded}<span>Dashboard</span>{/if}
      </a>
    </li>
    <li>
      <a
        href="#/process-management"
        class:active={$currentView === "process-management"}
      >
        <Icon icon="solar:cpu-linear" width="24" height="24" />
        {#if $isSidebarExpanded}<span>Process Management</span>{/if}
      </a>
    </li>
    <li>
      <a
        href="#/power-plan-management"
        class:active={$currentView === "power-plan-management"}
      >
        <Icon icon="solar:power-linear" width="24" height="24" />
        {#if $isSidebarExpanded}<span>Power Plan Management</span>{/if}
      </a>
    </li>
    <li>
      <a href="#/settings" class:active={$currentView === "settings"}>
        <Icon icon="solar:settings-linear" width="24" height="24" />
        {#if $isSidebarExpanded}<span>Settings</span>{/if}
      </a>
    </li>
  </ul>
</nav>

<style scoped>
  nav {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 60px; /* Collapsed width */
    background-color: var(--background-secondary);
    padding-top: 20px;
    border-right: 1px solid var(--background-primary);
    transition: width 0.15s ease-in-out;
    overflow-x: hidden; /* Hide text when collapsed */
    z-index: 100; /* Ensure sidebar stays on top */

    &.expanded {
      width: 270px; /* Expanded width */
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;
      margin-top: 40px;
      /* 
      nav.expanded & {
        margin-top: 0px;
      } */
    }

    /* .sidebar-title {
      display: flex;
      align-items: center;
      font-size: 20px;
      font-weight: 600;
      padding-inline: 20px;
      height: 80px;
      color: var(--primary-accent);
      white-space: nowrap;
    } */

    li a {
      text-decoration: none;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 15px 20px; /* Base padding, adjusted for icon centering when collapsed */
      font-size: 13px;
      font-weight: 400;
      transition:
        background-color 0.2s ease-in-out,
        color 0.2s ease-in-out;
      white-space: nowrap; /* Prevent text from wrapping */
      justify-content: center; /* Center icons when collapsed */

      span {
        opacity: 0;
        transition: opacity 0.2s ease-in-out;
        margin-left: 0; /* Ensure no extra margin when hidden */
      }

      &:hover {
        background-color: var(--background-primary);
        color: var(--primary-accent);
      }

      &.active {
        background-color: var(--primary-accent);
        color: var(--background-primary);
        font-weight: 600;
      }

      :global(svg) {
        min-width: 24px; /* Ensure icons have a minimum width */
        color: currentColor;
        transition: color 0.2s ease-in-out;
      }
    }
  }

  nav.expanded li a {
    justify-content: flex-start; /* Align items to start when expanded */
    padding: 15px 20px; /* Restore original padding */
  }

  nav.expanded li a span {
    opacity: 1;
    margin-left: 0; /* Reset margin if any specific was added for collapsed */
  }

  .logo {
    width: 60px;
    height: auto;
    display: block;
    /* position: absolute;
    bottom: 20px; */
    transition: 0.15s ease-in-out;
    margin-bottom: 40px;

    nav.expanded & {
      translate: 100px 0; /* Move logo to the right when expanded */
    }
  }
</style>
