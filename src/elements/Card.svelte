<script lang="ts">
  import Icon from "@iconify/svelte";
  import type { Snippet } from "svelte";

  /**
   * Props for the Card component.
   */
  interface Props {
    title?: string;
    icon?: string; // Iconify icon name string, e.g., "solar:home-linear"
    titleTag?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"; // Optional: specify heading tag, defaults to h3
    hasShadow?: boolean; // Optional: whether the card has a box-shadow
    children: Snippet; // Default slot content
    header_actions?: Snippet; // Named slot for header actions
  }

  let {
    title,
    icon,
    titleTag = "h3",
    hasShadow = true,
    children,
    header_actions,
  }: Props = $props();
</script>

<div class="card-container" class:has-shadow={hasShadow}>
  {#if title || icon || header_actions}
    <div class="card-header">
      <div class="card-header-main">
        {#if icon}
          <Icon {icon} width="24" height="24" />
        {/if}
        {#if title}
          <svelte:element this={titleTag} class="card-title">
            {title}
          </svelte:element>
        {/if}
      </div>
      {#if header_actions}
        <div class="card-header-actions">
          {@render header_actions()}
        </div>
      {/if}
    </div>
  {/if}
  <div class="card-content">
    {@render children()}
  </div>
</div>

<style>
  .card-container {
    background-color: var(--background-secondary);
    border-radius: var(--window-corner-radius);
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 15px; /* Gap between header (if present) and content */
  }

  .card-container.has-shadow {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .card-header {
    display: flex;
    justify-content: space-between; /* Aligns title/icon to left, actions to right */
    align-items: center;
    gap: 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--background-primary);
  }

  .card-header-main {
    display: flex;
    align-items: center;
    gap: 12px; /* Gap between icon and title */
  }

  .card-title {
    /* Applied to the dynamic <svelte:element> */
    margin: 0;
    color: var(--primary-accent);
    font-size: 18px; /* Standardized card title size */
    font-weight: 500; /* Inter Medium, common for titles */
  }

  .card-header :global(svg) {
    /* For the icon in card-header-main */
    color: var(--primary-accent);
  }

  .card-header-actions {
    /* Allows for buttons or other controls on the right side of the header */
  }

  .card-content {
    /* Content fills the rest of the card. Padding is handled by card-container. */
  }
</style>
