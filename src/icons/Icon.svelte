<script lang="ts">
  // Generic SVG Icon Component for Svelte 5 (Runes Mode)

  interface $$Props {
    iconName: string; // Name of the SVG file without .svg extension (e.g., "home")
    fillColor?: string; // Default will be applied in destructuring
    size?: string | number; // Default will be applied in destructuring
    class?: string; // For external CSS classes, will be aliased
    style?: string; // For external inline styles
    [key: string]: any; // Allows any other HTML attributes like aria-label, role, etc.
  }

  let {
    iconName,
    fillColor = "#E0E0E0", // Default to Off-White from design guidelines
    size = "24px", // Default size
    class: customClass = "", // Alias 'class' to 'customClass' to avoid issues
    style: styleString = "",
    ...restProps
  } = $props();

  let svgContent = $state("");
  let isLoading = $state(true);
  let hasError = $state(false);

  // Vite's import.meta.glob to dynamically import SVGs as raw text
  // This looks for .svg files in the same directory as this component (src/icons/).
  const svgModules = import.meta.glob("./*.svg", {
    query: "?raw",
    import: "default",
    eager: false,
  });

  $effect(() => {
    // This effect runs when iconName changes
    isLoading = true;
    hasError = false;
    svgContent = ""; // Clear previous content

    const path = `./${iconName}.svg`;

    const loadSvg = async () => {
      if (svgModules[path]) {
        try {
          // The result of the function call might be unknown to TypeScript
          const loadedModuleContent: unknown = await svgModules[path]();
          if (typeof loadedModuleContent === "string") {
            // Explicitly cast to string, though typeof check should suffice
            svgContent = loadedModuleContent as string;
          } else {
            console.error(
              `Loaded SVG content for "${iconName}" is not a string:`,
              loadedModuleContent
            );
            hasError = true;
          }
        } catch (e) {
          console.error(`Error loading SVG "${iconName}":`, e);
          hasError = true;
        }
      } else {
        console.warn(
          `SVG module not found for: "${iconName}" (path: ${path}). Available modules:`,
          Object.keys(svgModules)
        );
        hasError = true;
      }
      isLoading = false;
    };

    loadSvg();
  });

  const computedSize = typeof size === "number" ? `${size}px` : size;
  // Construct the style string for the wrapper span
  // The `color` CSS property on the span will be inherited by the SVG's `fill: currentColor`
  const wrapperStyle = `color: ${fillColor}; width: ${computedSize}; height: ${computedSize}; display: inline-flex; align-items: center; justify-content: center; ${styleString || ""}`;
</script>

<span
  {...restProps}
  class="svg-icon-wrapper {customClass}"
  style={wrapperStyle}
  role="img"
  aria-label={restProps["aria-label"] || `${iconName} icon`}
>
  {#if isLoading}
    <span
      class="loading-placeholder"
      style="width: {computedSize}; height: {computedSize};"
    ></span>
  {:else if hasError}
    <!-- Fallback error icon -->
    <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%">
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
      />
    </svg>
  {:else if svgContent}
    {@html svgContent}
  {/if}
</span>

<style>
  .svg-icon-wrapper {
    vertical-align: middle; /* Aligns icon nicely with text if used inline */
  }

  .svg-icon-wrapper :global(svg) {
    width: 100%;
    height: 100%;
    display: block;
    fill: currentColor; /* Main way to color the SVG via the span's 'color' style */
  }

  /* Attempt to override specific fills in the SVG with currentColor,
	   unless they are explicitly set to "none" or already "currentColor".
	   This helps ensure the 'fillColor' prop takes precedence for monochrome icons. */
  .svg-icon-wrapper
    :global(svg [fill]:not([fill="none"]):not([fill="currentColor"])) {
    fill: currentColor;
  }

  /* Optional: if strokes should also be controlled by fillColor and override existing stroke colors,
	   do the same for stroke attributes. */
  .svg-icon-wrapper
    :global(svg [stroke]:not([stroke="none"]):not([stroke="currentColor"])) {
    stroke: currentColor;
  }

  .loading-placeholder {
    display: inline-block;
    background-color: rgba(128, 128, 128, 0.1); /* Subtle placeholder */
    border-radius: 3px;
    /* width and height are set inline via style attribute on the element */
  }
</style>
