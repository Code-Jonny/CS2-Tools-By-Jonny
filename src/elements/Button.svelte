<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    onclick?: (event: MouseEvent) => void;
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    children: Snippet;
  }

  let {
    onclick,
    type = "button",
    disabled = false,
    children,
  }: Props = $props();
</script>

<button {type} {disabled} {onclick}>
  {@render children()}
</button>
