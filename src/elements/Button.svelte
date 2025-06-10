<script lang="ts">
  import type { Snippet } from "svelte";
  import Icon from "@iconify/svelte"; // Import Icon component

  interface Props {
    onclick?: (event: MouseEvent) => void;
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    children?: Snippet; // Make children optional if icon can be used alone
    style?: string;
    variant?: "primary" | "secondary" | "danger" | "success" | "icon"; // Add variant for styling
    icon?: string; // Add icon prop
    iconSize?: string; // Optional: for icon size
  }

  let {
    onclick,
    type = "button",
    disabled = false,
    children,
    style = "",
    variant = "primary", // Default variant
    icon,
    iconSize = "20", // Default icon size
  }: Props = $props();
</script>

<button {type} {disabled} {onclick} {style} class="button {variant}">
  {#if icon}
    <Icon {icon} width={iconSize} height={iconSize} />
  {/if}
  {#if children}
    {@render children()}
  {/if}
</button>

<style>
  .button {
    padding: 8px 15px;
    border: none;
    border-radius: var(--window-corner-radius, 4px);
    cursor: pointer;
    font-family: var(--font-family-inter);
    font-size: 16px; /* Button Text */
    font-weight: 600; /* Inter Semi-Bold */
    transition:
      background-color 0.2s ease-in-out,
      opacity 0.2s ease-in-out;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px; /* Gap between icon and text */
  }

  .button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Primary Button */
  .button.primary {
    background-color: var(--primary-accent, #00bfff);
    color: var(--background-primary, #1a1a1a); /* Dark text for high contrast */
  }
  .button.primary:hover:not(:disabled) {
    filter: brightness(1.1);
  }
  .button.primary:active:not(:disabled) {
    filter: brightness(0.9);
  }

  /* Secondary Button */
  .button.secondary {
    background-color: transparent;
    color: var(--text-primary, #e0e0e0);
    border: 1px solid var(--text-secondary, #888888);
  }
  .button.secondary:hover:not(:disabled) {
    background-color: var(--background-secondary, #242424);
  }
  .button.secondary:active:not(:disabled) {
    background-color: var(--background-primary, #1a1a1a);
  }

  /* Danger Button */
  .button.danger {
    background-color: var(--error-color, #dc3545);
    color: var(--text-primary, #e0e0e0);
  }
  .button.danger:hover:not(:disabled) {
    filter: brightness(1.1);
  }
  .button.danger:active:not(:disabled) {
    filter: brightness(0.9);
  }

  /* Success Button */
  .button.success {
    background-color: var(--success-color, #28a745);
    color: var(--text-primary, #e0e0e0);
  }
  .button.success:hover:not(:disabled) {
    filter: brightness(1.1);
  }
  .button.success:active:not(:disabled) {
    filter: brightness(0.9);
  }

  /* Icon-only Button (minimal styling, relies on icon color) */
  .button.icon {
    background-color: transparent;
    padding: 5px; /* Smaller padding for icon buttons */
    border: none;
    color: var(--text-primary); /* Default icon color */
  }
  .button.icon:hover:not(:disabled) {
    color: var(--primary-accent);
    background-color: var(--background-secondary); /* Subtle background */
  }
  .button.icon :global(svg) {
    /* Target Iconify component */
    display: block; /* Helps with alignment */
  }
</style>
