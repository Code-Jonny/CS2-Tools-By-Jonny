<script lang="ts">
  /**
   * A simple container component with standard padding and background.
   * Used for grouping content or settings that don't require a full card treatment (like a header or shadow).
   */
</script>

<div class="content-box-container">
  <slot></slot>
</div>

<style>
  .content-box-container {
    background-color: var(--background-secondary);
    padding: 15px;
    border-radius: var(--window-corner-radius);
  }
</style>
