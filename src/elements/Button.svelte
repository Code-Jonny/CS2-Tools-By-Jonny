<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    onclick?: (event: MouseEvent) => void;
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    children: Snippet;
    style?: string; // Add style prop
  }

  let {
    onclick,
    type = "button",
    disabled = false,
    children,
    style = "", // Initialize style prop
  }: Props = $props();
</script>

<button {type} {disabled} {onclick} {style}>
  {@render children()}
</button>
