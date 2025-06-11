<script lang="ts">
  import type { Snippet } from "svelte";

  /**
   * A simple container component with standard padding and background.
   * Used for grouping content or settings that don't require a full card treatment (like a header or shadow).
   */
  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<div class="content-box-container">
  {@render children()}
</div>

<style>
  .content-box-container {
    background-color: var(--background-secondary);
    padding: 30px 15px;
    border-radius: var(--window-corner-radius);
    font-size: 18px;
  }
</style>
